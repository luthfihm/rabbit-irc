#!/usr/bin/env node

var amqp = require('amqplib/callback_api');

var readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var username = makeid();
var queue = username;
var channels = [];

amqp.connect('amqp://167.205.32.46', function(err, conn) {
    conn.createChannel(function(err, ch) {
    	ch.assertQueue(queue);
        console.log("Welcome to Rabbit-IRC Chat");
		console.log("===============================================");
		console.log("Command List:");
		console.log("/JOIN <channel name>: Join channel");
		console.log("/LEAVE <channel name>: Leave channel");
		console.log("/NICK <your nick>: Change your nick name. Note: Everytime you change your nick, you must rejoin your subscribed channel");
		console.log("/EXIT: Exit from application");
		console.log('');
		console.log('To send message:');
		console.log("@<channel name>: Send message to a channel");
		console.log("To broadcast to all channel you have joined, just type your message and press enter");
		console.log("===============================================");
		console.log("You are logged in as "+username);
		ch.consume(queue, function(msg) {
	        console.log(msg.content.toString());
	    }, {noAck: true});
		rl.on('line', function(line){
	        //Process command

	        //Join Channel
	        if (line.indexOf('/JOIN') == 0){
	        	var channel = line.substr(6);
	            if (channels.indexOf(channel) == -1) {
	            	ch.assertExchange(channel, 'fanout', {durable: false,autoDelete: true,arguments: null});
	            	ch.bindQueue(queue, channel, '');
	            	channels.push(channel);
	            	console.log("Success joining channel");
	            } else {
	            	console.log("You are already join this channel!");
	            }
	        //Leave channel
	        } else if (line.indexOf('/LEAVE') == 0){
	            var channel = line.substr(7);
	            if (channels.indexOf(channel) != -1) {
	            	ch.unbindQueue(queue, channel, '');
	            	var index = channels.indexOf(channel);
	            	channels.splice(index,1);
	            	console.log("You have left the channel");
	            } else {
	            	console.log("Failed to leave channel!");
	            }
	        //Change nikcname
	        } else if (line.indexOf('/NICK') == 0){
	            username = line.substr(6);
	            console.log("Welcome, " + username);
	        //Send message to a channel
	        } else if (line.indexOf('@') == 0){
	            var i = line.indexOf(' ');
	            var channel = line.substr(1, i - 1);
	            var msg = line.substr(i + 1);
	            if (channels.indexOf(channel) != -1) {
	            	ch.publish(channel, '', new Buffer("@" + channel + " " + username + " : " + msg));
	            } else {
	            	console.log("You are not member of this channel!");
	            }
	        //Exit from application
	        } else if (line.indexOf('/EXIT') == 0){
	        	ch.close();
	            conn.close(); 
	            process.exit(0);
	        //Broadcast message
	        } else {
	            if ((line != '') && (channels.length > 0)) {
	            	for (var i = 0; i < channels.length; i++) {
	            		ch.publish(channels[i], '', new Buffer("@" + channels[i] + " " + username + " : " + line));
	            	};
	            }
	        }
	    });
    });
});

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}