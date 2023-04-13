if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const { Api, TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const sessions = JSON.parse(process.env.SESSIONS)
const api_Id = Number.parseInt(process.env.API_ID);
const { accounts, scheduleTime, supportGroupId, comment_texts, bioChangeTime } = require("./config")
const input = require('input');


function Turn(session, channelId, messageId, timestamp) {
    this.session = session;
    this.channelId = channelId;
    this.messageId = messageId;
    this.timestamp = timestamp;
}
let turnList = [];
// let timing = [...scheduleTimes]
// let channelsId = []
// let flag = false;
for (const session of sessions) {

    console.log("Loading interactive example...");
    const stringSession = new StringSession(session);
    const client = new TelegramClient(stringSession, api_Id, process.env.API_HASH, {
        connectionRetries: 5,
    });

    (async () => {
        let showSession;
        await client.start({
            phoneNumber: async () => await input.text("Please enter your number: "),
            password: async () => {
                showSession = true;
                return await input.text("Please enter your password: ")
            },
            phoneCode: async () =>
                await input.text("Please enter the code you received: "),
            onError: (err) => console.log(err),
        });
        console.log("You should now be connected.");
        if (showSession) {
            console.log(client.session.save()); // Save this string to avoid logging in again
        }
        // client.setParseMode("html");
        // const result = await changeBio("hello father ... ");
        // console.log(result);
        client.addEventHandler(async (update) => {

            // var d = new Date();
            // var n = d.toLocaleTimeString();
            // console.log("----------------------\nsomething recived! " + n);
            // console.log(update);
            try {
                // must be dlelte!
                if (update.className === "UpdateNewChannelMessage") {
                    
                    const { message } = update;
                    const from_channel_id = message.peerId.channelId;
                    const from_message_id = message.id;
                    // console.log(`new message from ${from_channel_id}`)



                    for (const account of accounts) {

                        if (account.session !== session) {

                            continue;
                        }
                        // console.log("pass account")
                        for (const channel of account.allowedChannels) {

                            if (channel.from_channel_id !== from_channel_id.toString()) {
                                continue;
                            }

                            if (!message.replies || !message.replies.comments) {
                                console.log("comments are cloesed!")
                                return;
                            }

                            let extendlimit = false;

                            if (turnList.length >= accounts.length) {
                                // console.log("pass length >= ", accounts.length)
                                // const result = turnList.filter((turn => turn.session === account.session));
                                let min = 99999999999999;
                                let tempSession;
                                for (const turn of turnList) {
                                    if (turn.channelId.value === from_channel_id.value && turn.messageId === from_message_id) {
                                        console.log("this post done before!")
                                        return;   // this post done before!
                                    }
                                    if (turn.timestamp < min) {
                                        min = turn.timestamp
                                        tempSession = turn.session
                                    }
                                }
                                // console.log(turnList);
                                // console.log("-----------------------------")
                                // console.log(tempSession);
                                console.log("not posted before and find less time stamp")
                                if (tempSession === account.session) {
                                    extendlimit = true;
                                    console.log("extend limit")
                                } else {
                                    return;
                                }
                            }
                            else if (turnList.length >= 1) {
                                // console.log("pass length >=1")
                                for (const turn of turnList) {
                                    if (turn.session === account.session || (turn.channelId.value === from_channel_id.value && turn.messageId === from_message_id)) {

                                        return;
                                    }
                                }
                            }


                            // if (turnList.length > 0 && (turnList.some((turn) => { turn.session === account.session })))

                            // if (channelsId.indexOf(from_message_id) !== -1) {
                            //     console.log("Another account handled this post!")
                            //     return
                            // }
                            // console.log("pass channelAlowing")

                            console.log(`new message from ${from_channel_id}`)
                            // turn.push(account.session);
                            // channelsId.push(from_message_id);

                            if (!extendlimit) {
                                const newturn = new Turn(account.session, from_channel_id, from_message_id, Date.now())
                                turnList.push(newturn);
                            }
                            // console.log(turnList)
                            // console.log("------------")

                            // const index = Math.floor(Math.random() * timing.length)
                            // const time = timing[index];
                            // console.log(time);
                            // timing.splice(index, 1);
                            // if (timing.length <= 0) {
                            //     timing = [...scheduleTimes]
                            // }

                            // flag = true;
                            // setTimeout(() => {
                            //     if (flag) {
                            //         flag = false;
                            //         console.log("reset timing!");
                            //         timing = [...scheduleTimes]
                            //     }
                            // }, 10 * 60 * 1000)

                            const commentText = comment_texts[Math.floor(Math.random() * comment_texts.length)];
                            setTimeout(async () => {
                                if (!extendlimit) {
                                    await changeBio(account.bioNotLink);
                                    console.log("bio change to not link")
                                } else {
                                    console.log("bio remained not linke! ")
                                    await changeBio(account.bioNotLink);
                                    const turnIndex = turnList.findIndex((turn => turn.session === account.session));
                                    turnList[turnIndex].timestamp = Date.now();
                                    turnList[turnIndex].messageId = from_message_id;
                                    turnList[turnIndex].channelId = from_channel_id;
                                }
                                // const turnIndex = turnList.findIndex((turn => turn.session === account.session));
                                // turnList[turnIndex].timestamp = Date.now();
                                await SendComment(channel.from_channel_id, channel.from_access_hash, from_message_id, commentText);
                                setTimeout(async () => {
                                    const turnIndex = turnList.findIndex((turn => turn.session === account.session));
                                    if (turnIndex === -1) {
                                        return;
                                    }
                                    const lastTimeStamp = turnList[turnIndex].timestamp
                                    if (lastTimeStamp + (bioChangeTime - 0.1) * 60 * 1000 <= Date.now()) {
                                        await changeBio(account.bioLink);
                                        console.log("bio change to link!")
                                        // turnList.splice(turnIndex, 1);

                                    } else {
                                        console.log("bio does not change due to new post")
                                    }
                                }, bioChangeTime * 1000 * 60)
                                console.log(`Comment sent after ${scheduleTime} minutes`)
                            }, scheduleTime * 1000 * 60)

                            //await SendComment(channel.from_channel_id, channel.from_access_hash, from_message_id, commentText);

                            // console.log(update);
                            // console.log("--------------")
                            // console.log(update.message.replies)
                            // console.log("--------------")
                            // console.log(update.message.peerId.channelId)

                        }
                    }
                    //----------------------------------------------------------------------------
                } else if (update.className === "UpdateEditChannelMessage") {
                    return; // remove!
                    const { message } = update;
                    const from_channel_id = message.peerId.channelId;
                    const from_message_id = message.id;
                    for (const channel of allowedChannels) {

                        if (channel.from_channel_id !== from_channel_id.toString()) {
                            continue;
                        }


                        //console.log(`edited message from ${from_channel_id}`)
                    };
                }
                else if (update.className === "UpdateDeleteChannelMessages") {
                    return;  //remove!
                    const from_channel_id = update.channelId;
                    const from_message_ids = update.messages;
                    // console.log(`deleted message from ${from_channel_id}`)
                    for (const channel of allowedChannels) {
                        if (channel.from_channel_id !== from_channel_id.toString()) {
                            continue;
                        }
                    }

                }
                else if (update.className === "UpdateShortChatMessage") {
                    const messageText = update.message;
                    const from_group_id = update.chatId;
                    //const from_user_id = update.fromId;
                    const account = accounts.find(acc => acc.session === session)
                    const supportGroupIdWithoutminez = supportGroupId.substring(1);
                    if (from_group_id.toString() !== supportGroupIdWithoutminez) {
                        return;
                    }
                    if (["Link", "link"].some(e => e === messageText)) {
                        await changeBio(account.bioLink);
                        await sendMessage(supportGroupId, `Bio changed to Link!`)
                        console.log("Bio changed to Link!")


                    } else if (["Notlink", "notLink", "NotLink", "notlink", "not link", "Not link"].some(e => e === messageText)) {

                        await changeBio(account.bioNotLink);
                        await sendMessage(supportGroupId, `Bio changed to notLink!`)
                        console.log("Bio changed to notLink!")
                    }

                }
            } catch (error) {

                console.log(error);

            }
        });

    })();

    async function sendMessage(chatId, message) {
        try {
            await client.sendMessage(chatId,
                {
                    message,
                }
            )

        } catch (error) {
            console.log(error)
        }
    }
    async function changeBio(text) {
        result = await client.invoke(new Api.account.UpdateProfile({
            about: text,
        }))
        return result;
    }

    async function SendComment(channelId, accessHash, commentTo, message) {
        try {

            await client.sendMessage(new Api.InputPeerChannel({ channelId, accessHash }),
                {
                    message,
                    commentTo,
                }

            )

        } catch (error) {
            if (error.code === 400) {
                await sendMessage(supportGroupId, `I am Baned from ${channelId}`)

                console.log("Baned notife sent To support group!")
            } else {
                console.log(error)
            }
        }
    }
}

