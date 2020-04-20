var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const multer=require('multer');
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'root',
	database : 'shopping'
});
var app = express();
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.set('view engine', 'hbs');
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(
	express.static(path.join(__dirname + '/UI'),{ index :false })
	);
app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/UI/firstpage.html'));
});
app.post('/auth_login', function(request, response) {
	var password = request.body.password;
	var rollno   = request.body.rollno;
	if (rollno && password) {
		connection.query('SELECT * FROM accounts WHERE password = ? AND rollno = ?', [password, rollno], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.rollno = rollno;
				console.log("loggedin successfully");
			} else {
				console.log('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		console.log('Please enter Username, Password and Rollno!');
		response.end();
	}
	response.sendFile(path.join(__dirname + '/UI/file_upload.html'));
});
app.post('/auth_signup', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	var rollno   = request.body.rollno;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ? AND rollno = ?', [username, password, rollno], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				if (request.session.loggedin) {
					console.log('Welcome back, ' + request.session.username + '!');
				}
			} else {
				connection.query('insert into accounts (username,password,rollno) values(?,?,?)',[username,password,rollno],function(error,results){});		
				console.log(username+"signed in successfully");
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username, Password and Rollno!');
		response.end();
	}
	response.sendFile(path.join(__dirname + '/UI/file_upload.html'));
});
app.get('/api/getProducts1',function(req,res){
	console.log(req.query.category);
	const category=req.query.category; 
	connection.query('SELECT * FROM PRODUCTS WHERE CATEGORY=?',[category],function(error,results){
		//connection.release();
		if(error){
			console.log(error);
		}
		else{
			//console.log(results);
			/* res.status(200).json({
				message:"success",
				data: results
			 }); */
			res.send('response sent');
		}
	});
});

const getProductsByType = (type,callback) => {
	connection.query('SELECT * FROM PRODUCTS WHERE CATEGORY=?',[type],(error,results) => {
		if(error) {
			callback(error,null);
		} else {
			callback(null,results);
		}
	});
}

app.get('/items', (req, res) => {
	const category=req.query.type;
	console.log(category) 
	getProductsByType(category,(error,result)=>{
		if(error){
			res.send(error);
		}
		else{
			console.log(result)
			res.render('items', {
				data: result,
				message: "success"
			})
		}
	});
	
})
app.listen(3000);



