
// @flow

'use strict';

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";


var connectPromise = (): Promise<MongoClient>  => {
    return new Promise((resolve, reject) => {
    
        MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
            if (err) 
                reject(err) ;
            else
                resolve(db);
                
        });
    });
};

var findPromise = (dbo: MongoClient.Db, filter: {} ) : Promise<MongoClient.Db> => {
    return new Promise((resolve, reject) => {
        
        
        dbo.collection("btcutxo").findOne(filter, 
            function(err, item) {
                if (err) 
                    reject(err);
                else
                    resolve(item);
            }
        );
    });
};

var upsertPromise = (dbo: MongoClient.Db, filter: {}, update: {}) : Promise<MongoClient.Db> => {
    return new Promise((resolve, reject) => {
        
        let newUpdate ={ $set: update };
        dbo.collection("btcutxo").findOneAndUpdate(filter, newUpdate, {upsert: true} ,
            function(err, res) {
                if (err) 
                    reject(err);
                else
                    resolve(res);
                   
            }
        );
    });
};

var deletePromise = (dbo: MongoClient.Db, filter: {}) : Promise<MongoClient.Db> => {
    return new Promise((resolve, reject) => {
        
        
        dbo.collection("btcutxo").findOneAndDelete(filter,
            function(err, res) {
                if (err) 
                    reject(err);
                else
                    resolve(res);
            }
        );
    });
};

async function mongotest()
{

    // connect mongo
    var db = await connectPromise();

    var dbo = db.db("mydb");

    var filter = {name: "Company Inc"};
    var update = {name: "Company Inc", address: "Highway 44"};
    
    // insert or update data
    await upsertPromise(dbo, filter, update);
    
    // close mongo
    db.close();
}

// mongotest();

module.exports = { connectPromise, upsertPromise, findPromise, deletePromise };

// MongoClient.connect(url, connectHandler);

// function connectHandler(err, db) {
//     if (err) throw err;
//     var dbo = db.db("mydb");
//     //   dbo.createCollection("customers", function(err, res) {
//     //     if (err) throw err;
//     //     console.log("Collection created!");
//     //     db.close();
//     //   });

//     //Step 1: declare promise
        
//     // var myPromise = () => {
//     //     return new Promise((resolve, reject) => {
        
//     //         db.collection('customers')
//     //         .find({id: 123})
//     //         .limit(1)
//     //         .toArray(function(err, data) {
//     //             err 
//     //                 ? reject(err) 
//     //                 : resolve(data[0]);
//     //         });
//     //     });
//     // };

//     var query = {name: "Company Inc"};
//     var update = { name: "Company Inc", address: "Highway 39" };
//     dbo.collection("customers").update(query, update, {upsert: true} ,
//         function(err, res) {
//             if (err) throw err;
//             console.log("Collection upserted!");
//             db.close();
//         }
//     );
// }

 