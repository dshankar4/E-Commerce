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
	response.sendFile(path.join(__dirname + '/UI/index.html'));
});
app.post('/auth_login', function(request, response) {
	const { password,rollno } = request.body;
	if (rollno && password) {
		connection.query('SELECT * FROM accounts WHERE password = ? AND rollno = ?', [password, rollno], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.rollno = rollno;
				console.log("loggedin successfully");
				response.status(200).json({ message: "Login succesful"})
			} else {
				response.status(500).json({ message: "Incorrect Username and/or Password!"})
				console.log('Incorrect Username and/or Password!');
			}			
		});
	} else {
		console.log('Please enter Username, Password and Rollno!');
		response.end();
	}
});
app.post('/auth_signup', function(request, response) {
	const { username,password,rollno } = request.body;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ? AND rollno = ?', [username, password, rollno], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				if (request.session.loggedin) {
					console.log('Welcome back, ' + request.session.username + '!');
					response.status(200).json({ message: "Login succesful"})
				}
			} else {
				connection.query('insert into accounts (username,password,rollno) values(?,?,?)',[username,password,rollno],function(error,results){});		
				console.log(username+"signed in successfully");
				response.status(200).json({ message: "Singup succesful"})
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username, Password and Rollno!');
		response.end();
	}
});
app.get("/filter_products",function(req,res){
	const {min,max,offer1,offer2,category}=req.query;
	connection.query('SELECT * FROM PRODUCTS WHERE CATEGORY=? and price >= ? and price <= ? and offer >= ? and offer <= ?',[category,min,max,offer1,offer2],(error,results) => {
		if(error) {
			console.log(error)
		} else {
			res.render('items', {
				data: results,
				message: "success"
			})
		}
	});

})

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
			res.render('items', {
				data: result,
				message: "success"
			})
		}
	});
	
})
const storage = multer.diskStorage({
	destination:'./UI/images/',
	filename:function(req, file, callback) {
	  var files = file.originalname;
	  callback(null, files);
	}
  });
  const uploadImages = multer({
	storage: storage
  });
  app.post('/upload', uploadImages.single('file'),(req,res)=>{
	const {name,price,offer,category,description}=req.body
	if(!req.file){
		  res.send("enter a search file")
	  }
	  else{
		  const { file } = req
		  connection.query('INSERT INTO PRODUCTS (name,category,price,offer,imgpath,description) VALUES (?, ?, ?, ?, ?, ?)',[name,category,price,offer,"./images/"+name,description], function(error, results){
			  if(error){
				  console.log("db not updated",error)

			  }
			  else{
				  console.log("updated successfully")
				  res.send("Uploaded successfully")
			  }
		  });
	  }
  })
  
app.listen(3000);



