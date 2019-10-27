const express = require ('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const fs = require('fs');
const unless = require('express-unless');


// CONNECTION TO DATABASE

app.use(bodyParser.urlencoded({ extended: true }));
let db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "watermelon",
  port: "3306"
});




// **************** USERS PART ****************

// CONNEXION
app.post('/v1/login', function(req, res, next){
  let email = req.body.email;
  let password = req.body.password;
    if (typeof email === 'undefined' || typeof password === 'undefined') {
        console.log('Login failed.');
        return res.sendStatus(400);
    }
  let query = `SELECT * FROM users WHERE email= ?`;
  db.query(query, email, function (err, result, fields) {

    if (err) throw err;
    if (result.length > 0) {
      bcrypt.compare(result[0].password, password, function (err, compare_result){
        if (err) {
          return res.status(401).json({
            message: "Access denied"
          });
        }
        if (result[0].password == password) {
          let secretKey = fs.readFileSync("secretKey.txt");
          let token = jwt.sign({
            email: email,
            user_id: result[0].id,
            is_admin: result[0].is_admin,
            first_name: result[0].first_name,
            last_name: result[0].last_name
          }, secretKey);
          return res.status(200).json({
            access_token: token
          });
        }
        else {
          return res.status(401).json({
            message: "Access denied !"
          });
        }
      });
    }
    else {
      return res.status(401).json({
        message: "Access denied"
      });
    }
  });

});

var checkToken = function (req, res, next) {
  if ("x-auth-token" in req.headers) {
    let token = req.headers["x-auth-token"];
    let secretKey = fs.readFileSync('secretKey.txt');
    //let decoded = jwt.verify(token, secretKey);
      if (token != undefined) {
          jwt.verify(token, secretKey, (err, decoded) => {

              if (err) {

                  res.status(401).json(JSON.stringify(token));
              } else {

                  let query = `SELECT * FROM users WHERE email = '${decoded.email}'`
                  // let query = `SELECT * FROM users WHERE apikey='${token}'`;
                  db.query(query, function (err, result, fields) {
                      if (err) throw err;
                      if (result.length > 0) {

                          req.user = result[0];
                          let user_id=req.user.id;
                          next();
                      } else {


                          // res.status(401);
                          res.status(403).json(JSON.stringify(token));
                          //res.redirect('/v1/login');
                      }
                  });

              }
          });
      } else {



          res.status(401).json(JSON.stringify(token));
      }

  } else {

      if (req.originalUrl == "/v1/users") {
          res.sendStatus(401);
      } else {
          res.sendStatus(400);
      }
  }

};
checkToken.unless = unless;
app.use(checkToken.unless({path: [{url:'/v1/users',methods:'POST'} , '/v1/login']}));

//app.use(function (req, res, next) {
  //let token = req.headers["x-auth-token"];
  //let secretKey = fs.readFileSync('secretKey.txt');
  //let decoded = jwt.verify(token, secretKey);

  //let user_id = decoded.user_id;
  //let is_admin = decoded.is_admin;

  //next();
//});

// LISTER TOUS LES UTILISATEURS

app.get('/v1/users', function(req, res) {

  let query = "SELECT first_name,last_name,email,is_admin,id FROM Users ";

  db.query(query, function (err, result, fields) {
    if (err) {
        res.status(400).send(JSON.stringify("Error"));
    }
    else{
        var list_result =[];
        for (i=0; i<result.length; i++){
            const user  = {
                id: result[i].id,
                first_name: result[i].first_name,
                last_name: result[i].last_name,
                email: result[i].email,
                is_admin: result[i].is_admin ===1,
            }
            list_result.push(user);
        }
        console.log(list_result);
        res.status(200).send(JSON.stringify(list_result));
    }

  });


});

// ACCEDER A UN UTILISATEUR

app.get('/v1/users/:id', function(req, res) {

  let id = req.params.id;
  let query = `SELECT first_name,last_name,email,is_admin FROM users WHERE id=${id}`;

  db.query(query, function(err, result, fields) {
    if (err) throw err;
    res.send(JSON.stringify(result));
  });

});

// CREER UN UTILISATEUR

app.post('/v1/users', function(req, res) {

  let {first_name, last_name, email, password, is_admin} = req.body;
  console.log(first_name + last_name + email + password + is_admin);
 // var createUser = function (hash) {
   // var promise = new Promise(function (resolve, reject) {
      console.log("create User");
      if (is_admin == true){
          is_admin = 1;
      }
      else{
          is_admin = 0;
      }
      let query0 = `INSERT INTO users (first_name, last_name, email, password, is_admin) VALUES ('${first_name}','${last_name}', '${email}', '${password}', '${is_admin}')`;

      db.query(query0, function (err, result, fields) {
          console.log("test1");

          if (err) throw err;
          if (is_admin == 0) {
              is_admin = false;
          }
          else {
              is_admin = true;
          }
          res.status(200).json({
              id: result.insertId,
              access_token: null,
              first_name: first_name,
              last_name: last_name,
              email: email,
              is_admin: is_admin==1? true : false,
          });
        // console.log(result.insertId);
        //resolve(result.insertId);
     // });
   // });
   // return promise;
  //};


 // var createWallet = function (userId) {
    //var promise = new Promise(function (resolve, reject) {
      console.log("create Wallet");
        //if (is_admin = false){
           // is_admin = 1;
        //}
       // if (is_admin = true){
           // is_admin = 0;
        //}
        let query = `INSERT INTO wallets (user_id) VALUES ('${result.insertId}')`;
        db.query(query, function (err, result, fields) {
          console.log("test2");
         if (err) throw err;
          //res.status(200).json({
             // id: result.insertId,
             // access_token: null,
             // first_name: first_name,
             // last_name: last_name,
              //email: email,
             // is_admin: is_admin==1? true : false,
          });
       // resolve(userId);
     });
   // });


    //return promise;
  //};



      //var sendUserResponse = function (userId) {
        //var promise = new Promise(function (resolve, reject) {
          //let query = "SELECT id, first_name, last_name, email, is_admin FROM users WHERE id = ?";
         // db.query(query, userId, function (err, result, fields) {
              console.log("test3");
            //if (err) throw err;

           // resolve();
        //  });
        //});
        //return promise;


     // };

  bcrypt.hash(password, saltRounds, function (err, hash) {
   // createUser(hash).then(createWallet);

  });



});


// MODIFIER UN UTILISATEUR
app.put('/v1/users/:id', function(req, res) {

  let id = req.params.id;
  let {first_name, last_name, email, password, is_admin,api_key} = req.body;
  let query = `UPDATE users SET  first_name = ('${first_name}'), last_name = ('${last_name}'), email = ('${email}'), password = ('${password}'), is_admin = ('${is_admin}'), api_key = ('${api_key}') WHERE id=${id}`;

  db.query(query, function(err, result, fields) {
    if (err) throw err;
    res.send(JSON.stringify("Success"));
  });

});


// SUPPRIMER TOUS LES UTILISATEURS
app.delete('/v1/users', function(req, res) {
  let query = "DELETE FROM users";

  db.query(query, function(err, result, fields) {
    if (err) throw err;
    res.send(JSON.stringify("Success"));
  });
});

// SUPPRIMER UN UTILISATEUR SELON SON ID

app.delete('/v1/users/:id', function(req, res) {

  let id = req.params.id;

  //Supprime tout d'abord son wallet

  let query1 = `DELETE FROM wallets WHERE user_id=${id}`;
  db.query(query1, function(err, result, fields) {
    if (err) throw err;
  });

  // Suppression de l'utilisateur
  let query2 = `DELETE FROM users WHERE id=${id}`;

  db.query(query2, function(err, result, fields) {
    if (err) throw err;
    res.send(JSON.stringify("Success"));
  });
});




// **************** CARDS PART ****************

// LISTER TOUTES LES CARTES

app.get('/v1/cards', function(req, res) {

  let query = "SELECT * FROM Cards";

  db.query(query, function(err, result, fields) {
    if (err) throw err;
    res.send(JSON.stringify(result));
  });

});

// LISTER LES CARTES PAR RAPPORT A LEUR ID

app.get('/v1/cards/:id', function(req, res) {

  let id = req.params.id;
  let query = `SELECT * FROM cards WHERE id=${id}`;

  db.query(query, function(err, result, fields) {
    if (err) throw err;
      if (result.length > 0) {
          res.json(result[0]);
      } else {
          res.sendStatus(404);
      }
  });

});



// CREER UNE NOUVELLE CARTE

app.post('/v1/Cards', function(req, res) {
    let user_id=req.user.id;
  let { last_4, brand,expired_at} = req.body;
    console.log(user_id , last_4 , brand , expired_at );

    if ( req.body.hasOwnProperty('last_4') && req.body.hasOwnProperty('brand') && req.body.hasOwnProperty('expired_at')) {
        let brands = ['visa', 'master_card', 'american_express', 'union_pay', 'jcb'];
        if (brands.includes(brand) && (last_4.length == 4) &&  (new Date(expired_at) > new Date())) {

            let query = `INSERT INTO Cards (user_id, last_4, brand, expired_at) VALUES ('${user_id}', '${last_4}', '${brand}', '${expired_at}')`;

            db.query(query, function (err, result, fields) {
                console.log(req.body)
                if (err) throw err;
                res.json({
                    id: result.insertId,
                    user_id: user_id,
                    last_4: last_4,
                    brand: brand,
                    expired_at: expired_at
                });;

            });
        }
        else{
            return res.sendStatus(400)
        }

    }
    else {
        return res.sendStatus(400);
    }
});


// MODIFIER UNE CARTE

//app.put('/v1/cards/:id', function(req, res) {

  //let id = req.params.id;
  //let {user_id, last_4, brand, expired_at} = req.body;

  //let query = `UPDATE cards SET user_id= ('${user_id}'), last_4 = ('${last_4}'), brand = ('${brand}'), expired_at = ('${expired_at}')  WHERE id=${id}`;

  //db.query(query, function(err, result, fields) {
    //if (err) throw err;
    //res.send(JSON.stringify("Success"));
 // });

//});

// SUPPRIMER UNE CARTE SELON SON ID

app.delete('/v1/cards/:id', function(req, res) {

  let id = req.params.id;
  let query = `DELETE FROM cards WHERE id=${id}`;

  db.query(query, function(err, result, fields) {
    if (err) throw err;

    if (result.affectedRows > 0) {
        return res.sendStatus(204);
    }
    else {
        return res.sendStatus(404);
    }
  });

});


// **************** WALLET PART ****************

app.get('/v1/wallets/:id', function(req, res) {

  let id = req.params.id;
  // Initialiser la variable (balance = 0 par defaut)
  let balance = 0;
  // Obtenir tous les payins de wallet_id
  let query1 = `Select * FROM payins WHERE wallet_id = ${id}`;
  // Additionner le amount de tous les payins
  db.query(query1, function(err, result, fields) {
    // Initialiser la variable (balance = 0 par defaut)

    for (let i = 0; i < result.length; i++){
      balance = balance + result[i].amount;
    }
    if (err) throw err;
  });


  // Obtenir tous les payouts de wallet_id
  let query2 = `Select * FROM payouts WHERE wallet_id = ${id}`;
  // Soustraire le amount de tous les payouts
  db.query(query2, function(err, result, fields) {
    // Initialiser la variable (balance = 0 par defaut)
    for (let i = 0; i < result.length; i++){
      balance = balance - result[i].amount;
    }
    if (err) throw err;
  });

  // Obtenir tous les transfers de wallets_id
  //Cas ou il reçoit : Additionner les amount
  let query3 = `Select * FROM transfers WHERE debited_wallet_id = ${id}`;
  // Soustraire le amount de tous les debits
  db.query(query3, function(err, result, fields) {

    for (let i = 0; i < result.length; i++){
      balance = balance - result[i].amount;
    }
    if (err) throw err;
  });
  //Cas ou il envoie : Soustraire les amount
  let query4 = `Select * FROM transfers WHERE credited_wallet_id = ${id}`;
  // Soustraire le amount de tous les debits
  db.query(query4, function(err, result, fields) {
    // Initialiser la variable (balance = 0 par defaut)
    for (let i = 0; i < result.length; i++){
      balance = balance + result[i].amount;
    }
    if (err) throw err;
    res.send(JSON.stringify("wallet_id : " + id + " balance : " + balance ));
  });
});

// RETOURNE UN PORTEFEUILLE SELON L'ID

app.get('/v1/wallets/', function(req, res) {
  let query = "SELECT * FROM wallets";
  let balance = 0
  db.query(query, function(err, result, fields) {
    if (err) throw err;
      let response = {
          "wallet_id": result[0].id,
          "balance": balance
      };

      res.json([response]);
  });

});

// **************** PAYINS PART ****************

app.get('/v1/payins/:id', function(req, res) {

  let id = req.params.id;
  let query = `SELECT * FROM payins WHERE id = ${id}`;

  db.query(query, function(err, result, fields) {
    if (err) throw err;
      if (result.length > 0) {
          return res.json(result[0]);
      } else {
          return res.sendStatus(404);
      };
  });

});
app.get('/v1/payins', function(req, res) {

    let id = req.params.id;
    let query = `Select * FROM payins`;

    db.query(query, function(err, result, fields) {
        if (err) throw err;
        res.send(JSON.stringify(result));
    });

});

// EFFECTUER UN DEPOT D'ARGENT

app.post('/v1/payins', function(req, res) {

  let {id, wallet_id, amount} = req.body;
  let query = `INSERT INTO PAYINS (wallet_id, amount) VALUES ('${wallet_id}', '${amount}')`;
    if (RegExp(/^\d+$/).test(amount)) {
        db.query(query, function(err, result, fields) {
            if (err) throw err;
            let response = {
                id: result.insertId,
                wallet_id: parseInt(wallet_id, 10),
                amount: parseInt(amount, 10)
            };
            return res.json(response);
        });
    }
    else {
        return res.sendStatus(400);
    }


});


// **************** PAYOUTS PART ****************

app.get('/v1/payouts/:id', function(req, res) {

    let id = req.params.id;
    let query = `SELECT * FROM payouts WHERE id = ${id}`;

    db.query(query, function(err, result, fields) {
        if (err) throw err;
        if (result.length > 0) {
            return res.json(result[0]);
        } else {
            return res.sendStatus(404);
        };
    });

});
app.get('/v1/payouts', function(req, res) {

    let id = req.params.id;
    let query = `Select * FROM payouts`;

    db.query(query, function(err, result, fields) {
        if (err) throw err;
        res.send(JSON.stringify(result));
    });

});

// EFFECTUER UN RETRAIT D'ARGENT

app.post('/v1/payouts', function(req, res) {

  let {id, wallet_id, amount} = req.body;
  let query = `INSERT INTO payouts (id, wallet_id, amount) VALUES ('${id}', '${wallet_id}', '${amount}')`;

  db.query(query, function(err, result, fields) {
    if (err) throw err;
    res.send(JSON.stringify("Success"));
  });

});

// **************** TRANSFERS PART ****************

app.get('/v1/transfers/:wallet_id', function(req, res) {

  let wallet_id = req.params.wallet_id;
  let query = `Select * FROM transfers WHERE debited_wallet_id = ${wallet_id} OR credited_wallet_id = ${wallet_id}`;

  db.query(query, function(err, result, fields) {
    if (err) throw err;
    res.send(JSON.stringify(result));
  });

});

//EFFECTUER UN TRANSFERT D'ARGENT VERS UN AUTRE UTILISATEUR

app.post('/v1/transfers', function(req, res) {

  let {id, debited_wallet_id, credited_wallet_id, amount} = req.body;
  let query = `INSERT INTO transfers (id, debited_wallet_id, credited_wallet_id, amount) VALUES ('${id}', '${debited_wallet_id}', '${credited_wallet_id}', '${amount}')`;

  db.query(query, function(err, result, fields) {
    if (err) throw err;
    res.send(JSON.stringify("Success"));
  });

});

// LISTENNING

app.listen(8000, function(){
  console.log('Listening on port : 8000');
});
