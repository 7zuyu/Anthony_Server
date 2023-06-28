var express = require('express');
var bodyparser = require('body-parser');
var fs = require('fs');
var mysql = require('mysql');
var app = express();

app.use(bodyparser.json());
const {json} = require('body-parser');
const QRCode = require('qrcode');

const conn = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : 'root123',
    database : 'booking'
});

conn.connect(function(err){
    if (err) throw err;
    console.log("MySQL connected.....");
});

//login admin
app .post('/loginadmin', function(req, res) {
    console.log("POST request /loginadmin");
    let username = {user: req.body.username};
    json.getString
    let password = {pass: req.body.password};
    let sql = "SELECT idadmin, Emailadmin FROM loginadmin WHERE Emailadmin='"+username.user+"' AND Passwordadmin = '"+password.pass+"'";
    console.log(sql)
    let query = conn.query(sql, (err, result) => {
        console.log(JSON.stringify(
            {"status" : 200, "error" : null, "response" : result}
        ));
        if(result != "") {
            res.send("Login Berhasil")
            
        }
        else {
            res.send("Login Gagal")}
    });
});

//register
app.post('/register', function(req, res) {
    console.log('POST request /register');
    let username = {user: req.body.username};
    json.getString
    console.log("POST request data ="+JSON.stringify(username.user));

    let password = {pass: req.body.password};
    console.log("POST request data ="+JSON.stringify(password.pass));

    let email = {mail: req.body.email};
    console.log("POST request data ="+JSON.stringify(email.mail));

    let check = "SELECT username FROM register WHERE username ='"+username.user+"'";

    let checker = conn.query(check, (err, checkresult)=>{
        console.log(JSON.stringify(
            {
                "status" : 200,
                "error" : null,
                "response" : checkresult
            }
        ));
        console.log(checkresult);
        if (checkresult == ""){
            let sql = "INSERT INTO register (username, password, email) VALUES ('"+username.user+"','"+password.pass+"','"+email.mail+"')";
            let query = conn.query(sql, (err, result) =>{
                console.log(JSON.stringify(
                    {
                        "status" : 200,
                        "error" : null,
                        "response" : result
                    }
                ));
                conn.query(check, (err, checkresult) => {
                    console.log(JSON.stringify(
                        {
                            "status" : 200,
                            "error" : null,
                            "response" : checkresult
                        }
                    ));
                });
                // res.send(checkresult);
                res.send("Pendaftaran Berhasil , User ID =" +result.insertId)
            });
        }
        else {
            // res.send(checkresult);
            res.send("Pendaftaran Gagal")
        }
    })
});

//login user
app.post('/loginuser', function(req, res) {
    console.log("POST request /loginuser");
    let username = {user: req.body.username};
    let password = {pass: req.body.password};
  
    let sql = "SELECT id, username FROM register WHERE username='"+username.user+"' AND password = '"+password.pass+"'";
    console.log(sql);
  
    let query = conn.query(sql, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).json({ status: 500, error: 'Internal Server Error', response: null });
      } else {
        if (result.length > 0) {
          res.status(200).json({ status: 200, error: null, response: 'Login Berhasil' });
        } else {
          res.status(401).json({ status: 401, error: 'Unauthorized', response: 'Login Gagal' });
        }
      }
    });
  });

  //list booking
app.get('/listbooking', function(req, res) {
    console.log('Menerima GET request /listbooking');
    let sql = "SELECT * FROM booking";
    let query = conn.query(sql, function(err, result) {
        if (err) throw err;

        console.log(JSON.stringify({
            "status": 200,
            "error": null,
            "response": result
        }));

        res.send(JSON.stringify({
            "status": 200,
            "error": null,
            "response": result
        }));
    });
});

//list wahana
app.get('/listwahana', function(req, res) {
    console.log('Menerima GET request /listwahana');
    let sql = "SELECT * FROM listwahana";
    let query = conn.query(sql, function(err, result){
        if (err) throw err;
        res.send(JSON.stringify({
            "status" : 200,
            "error" : null,
            "response" : result
        }));
    });
});

//edit list wahana
app.put('/editwahana', function(req, res) {
    let NomorWahana = {Jumlah: req.body.NomorWahana};
    let NamaWahana = {Harga: req.body.NamaWahana};
    let DeskripsiWahana = {List: req.body.DeskripsiWahana};
    let HargaWahana = {List1: req.body.HargaWahana};
    console.log(NomorWahana)
    console.log(NamaWahana)
    console.log(DeskripsiWahana)
    console.log(HargaWahana)
    let sql = "UPDATE listwahana SET DeskripsiWahana='"+DeskripsiWahana.List+"', NamaWahana='"+NamaWahana.Harga+"', HargaWahana='"+HargaWahana.List1+"' WHERE NomorWahana='"+NomorWahana.Jumlah+"'";
    let query = conn.query(sql, (err, result) => {
        console.log(JSON.stringify(
            {
                "status" : 200,
                "error" : null,
                "response" : result
            }
        ));
        console.log(sql)
        if(result.affectedRows == "0") {
            res.send ("Gagal Edit Data")
        }
        else {
            res.send ("Berhasil Mengedit Data")
        }
    })
});

//booking
app.post('/booking', function(req, res) {
    console.log("POST request /booking");
    let username = req.body.username;
    let tanggal = req.body.tanggal;
    let nomorwahana = req.body.nomorwahana;
  
    let checkAvailabilityQuery = "SELECT stok FROM listwahana WHERE NomorWahana = ?";
    let checkAvailabilityParams = [nomorwahana];
  
    conn.query(checkAvailabilityQuery, checkAvailabilityParams, (err, availabilityResult) => {
      if (err) {
        console.error(err);
        res.status(500).json({ status: 500, error: 'Internal Server Error', response: null });
      } else {
        if (availabilityResult.length > 0 && availabilityResult[0].stok > 0) {
          // Generate the booking code
          let bookingCode = generateBookingCode();
  
          // Insert the booking data
          let insertBookingQuery = "INSERT INTO booking (username, tanggal, nowahana, bookingCode) VALUES (?, ?, ?, ?)";
          let insertBookingParams = [username, tanggal, nomorwahana, bookingCode];
          conn.query(insertBookingQuery, insertBookingParams, (err, bookingResult) => {
            if (err) {
              console.error(err);
              res.status(500).json({ status: 500, error: 'Internal Server Error', response: null });
            } else {
              if (bookingResult.affectedRows > 0) {
                // Decrease the available vehicle count
                let updateAvailabilityQuery = "UPDATE listwahana SET stok = stok -1 WHERE NomorWahana = ?";
                let updateAvailabilityParams = [nomorwahana];
                conn.query(updateAvailabilityQuery, updateAvailabilityParams, (err, updateResult) => {
                  if (err) {
                    console.error(err);
                    res.status(500).json({ status: 500, error: 'Internal Server Error', response: null });
                  } else {
                    console.log("Booking data inserted.");
                    res.status(200).json({ bookingId: bookingResult.insertId, bookingCode: bookingCode });
                  }
                });
              } else {
                res.status(500).json({ status: 500, error: 'Internal Server Error', response: null });
              }
            }
          });
        } else {
          res.status(400).json({ status: 400, error: 'Bad Request', response: 'Stok tidak tersedia' });
        }
      }
    });
  });
  
  function generateBookingCode() {
    // Logic to generate a unique booking code
    // You can customize the logic based on your requirements
    // Example: Generate a random alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    const codeLength = 8;
    for (let i = 0; i < codeLength; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

//cancel booking
app.post('/cancelbooking', function(req, res) {
    console.log('POST request /cancelbooking');
    json.getString
    let username = req.body.username; // Remove the object notation
    let nobooking = req.body.nobooking; // Remove the object notation

    let checkBookingQuery = "SELECT * FROM booking WHERE username = ? AND nobooking = ?";
    let checkBookingParams = [username, nobooking];

    conn.query(checkBookingQuery, checkBookingParams, (err, bookingResult) => {
        if (err) {
        console.error(err);
        res.status(510).json({ status: 510, error: 'Internal Server Error', response: null });
        } else {
            if (bookingResult.length > 0) {
                let deleteBookingQuery = "DELETE FROM booking WHERE nobooking = ?";
                let deleteBookingParams = [nobooking];
          
                conn.query(deleteBookingQuery, deleteBookingParams, (err, deleteResult) => {
                if (err) {
                    console.error(err);
                    res.status(501).json({ status: 501, error: 'Internal Server Error', response: null });
                } else {
                    if (deleteResult.affectedRows > 0) {
                        let updateAvailabilityQuery = "UPDATE listwahana SET stok = stok + 1 WHERE NomorWahana = ?";
                        let updateAvailabilityParams = [bookingResult[0].nowahana];
                      
                        conn.query(updateAvailabilityQuery, updateAvailabilityParams, (err, updateResult) => {
                            if (err) {
                                console.error(err);
                                res.status(502).json({ status: 502, error: 'Internal Server Error', response: null });
                            } else {
                                console.log("Booking canceled");
                                res.status(200).json({ status: 200, error: null, response: 'Booking canceled' });
                            }
                        });
                    } else {
                    res.status(503).json({ status: 503, error: 'Internal Server Error', response: null });
                    }
                    }
                    });
                } else {
            res.status(404).json({ status: 404, error: 'Not Found', response: 'Booking not found.' });
            }
        }
    });
});

// get booking code
app.post('/getbookcode', function(req, res) {
    console.log('POST request /getbookcode');
    let username = req.body.username;
    let nomorwahana = req.body.nomorwahana;
    let nobooking = req.body.nobooking

    let sql = "SELECT bookingCode FROM booking WHERE username='" + username + "' AND nowahana='" + nomorwahana + "' AND nobooking='" + nobooking +"'";
    console.log(sql);

    let query = conn.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ status: 500, error: 'Internal Server Error', response: null });
        } else {
            if (result.length > 0) {
                res.status(200).json({ status: 200, error: null, response: result[0].bookingCode });
            } else {
                res.status(404).json({ status: 404, error: 'Not Found', response: 'Booking not found.' });
            }
        }
    });
});

var server = app.listen(7071,function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log("Express app listening at http://%s:%s", host,port);
});