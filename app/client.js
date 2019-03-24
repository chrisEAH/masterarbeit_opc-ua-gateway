//https://github.com/node-opcua/node-opcua/blob/master/documentation/creating_a_client.md
const opcua = require("node-opcua");
const async = require("async");
var mqtt = require('mqtt');
var os=require('os');

const clientOPC = new opcua.OPCUAClient();


var config={
    opcEndPoint:"opc.tcp://edgeComputer:4334/OPCUA/SimulationServer",
    sensor:"ns=5;s=Square1",
    mqttBroker:"mqtt://127.0.0.1",
    requestedPublishingInterval:1000,
    mqttTopic:"halleX/porduktionslinieX/temperatur"
};

if(process.env.opc_end_point!=undefined){config.opcEndPoint=process.env.opc_end_point};
if(process.env.sensor!=undefined){config.opcNodeId=process.env.sensor};
if(process.env.mqtt!=undefined){config.mqttBroker=process.env.mqtt;}
if(process.env.requestedPublishingInterval!=undefined){config.requestedPublishingInterval=process.env.requestedPublishingInterval;}
if(process.env.mqtt_topic!=undefined){config.mqttTopic=process.env.mqtt_topic;}

var topic = config.mqttTopic;

console.log("Parameterreinfolge: opcEndPoint, opcNodeId, mqttBroker");
console.log("Beispiel: opc.tcp://DESKTOP-BMPPPBP:4334/OPCUA/SimulationServer  ns=5;s=Counter1 mqtt://127.0.0.1");


console.log("opcEndPoint: " + config.opcEndPoint);
console.log("mqttEndPoint: " + config.mqttBroker);
console.log("opcNodeId: " + config.opcNodeId);
console.log("mqtt topic: " + topic);
console.log("requestedPublishingInterval: " + config.requestedPublishingInterval);

var clientMqtt = mqtt.connect(config.mqttBroker);


let the_session, the_subscription;

async.series([
    function (callback) {
        clientMqtt.on('connect', function () {
            {
                console.log("connect to MQTT Endpoint: " + config.mqttBroker);
                callback(0);
            }
        });
    },

    // step 1 : connect to
    function (callback) {
        clientOPC.connect(config.opcEndPoint, function (err) {
            if (err) {
                console.log(" cannot connect to OPC UA Endpoint :" + config.opcEndPoint);
            } else {
                console.log("connected !");
            }
            callback(err);
        });
    },

    // step 2 : createSession
    function (callback) {
        clientOPC.createSession(function (err, session) {
            if (!err) {
                the_session = session;
            }
            callback(err);
        });
    },

    // step 4' : read a variable with read
    function (callback) {
        the_subscription = new opcua.ClientSubscription(the_session, {
            //https://www.prosysopc.com/blog/opc-ua-sessions-subscriptions-and-timeouts/
            requestedPublishingInterval: config.requestedPublishingInterval, //intervall der abfrage
            requestedLifetimeCount: 10, //wann der server die verbindung abbrechen soll, wenn client sich nicht meldet 
            requestedMaxKeepAliveCount: 2, //wann der server keep alive sendet, wenn keine neuen notifications vorliegen
            publishingEnabled: true,
        });

        the_subscription.on("started", function () {
            console.log("subscriptionId=", the_subscription.subscriptionId);
        }).on("keepalive", function () {
            console.log("keepalive");
        }).on("terminated", function () {
            console.log("terminated");
        });

        //monitoring
        const monitoredItem = the_subscription.monitor({
            nodeId: opcua.resolveNodeId(config.sensor),   //welche NodeId 
            attributeId: opcua.AttributeIds.Value //welches Attribute von der NodeId
        },
            {
                samplingInterval: 100,
                discardOldest: true,
                queueSize: 10
            },
            opcua.read_service.TimestampsToReturn.Both
        );
        console.log("-------------------------------------");

        monitoredItem.on("changed", function (dataValue) {
            console.log("wert: " + dataValue.value.value);
            //console.log(dataValue);
            wert = String(dataValue.value.value);
            var o={"Sensor":config.sensor,
                "Wert":[wert],
                "Einheit":["Zahl"],
                "Zeitstempel":date.getDate()+"."+date.getMonth()+"."+date.getFullYear()+"-"+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+","+date.getMilliseconds(),
                "Standort":config.mqttTopic.split("/")};
            
            clientMqtt.publish(topic,JSON.stringify(o));
        });
    },

    // close session
    function (callback) {
        the_session.close(function (err) {
            if (err) {
                console.log("closing session failed ?");
            }
            callback();
        });
    }

    ],
    function (err) {
    if (err) {
            console.log(" failure ", err);
        } else {
            console.log("done!");
        }
        //client.disconnect(function(){});
    });


function getNodeId()
{
    return os.hostname().replace(/\-/g, '/');
}