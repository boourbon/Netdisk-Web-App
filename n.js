const express = require('express');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const Multer = require('multer');
const ejs = require('ejs');

const server = express();


const loginRouter = express.Router();
const showRouter = express.Router();

server.listen(9111);
server.use(Multer({dest:'./wp/allFiles'}).any());

server.use('/login',loginRouter);
server.use('/show',showRouter);

server.use('/show.html',(req,res)=>{
	res.setHeader('Access-Control-Allow-Origin','*');


	//console.log(req.query.page)
	if(req.query.page == undefined || req.query.page == 0){
		var page = 0
	}
	else{
		var page = req.query.page;
	}
	var Pool = mysql.createPool({
				'host':'localhost',
				'user':'root',
				'password':'123456',
				'database':'wp'
			});
	Pool.getConnection((err,c)=>{
		if(err){
			console.log(err);
			res.send({'ok':0,'msg':'Connection failed with the database.'});
			//c.end();
		}
		else{
			c.query('SELECT * FROM `allFiles`;',(err,data)=>{
				if(err){
					console.log(err);
					res.send({ok:0,data:'Connection Failed.'});
				}
				else{
					var newData = data.slice(page*10,page*10+10);
					console.log(newData)
					ejs.renderFile('./wp/show.ejs',{allData:newData,page:page},function(err,data){

						res.send(data);
						//console.log(data)
					});
					//res.send({ok:1,data:data})
				};
				c.end();
			})
		}


	})
	
});

//Download
showRouter.use('/addDownload',(req,res)=>{
	res.setHeader('Access-Control-Allow-Origin','*');
	
	var Pool = mysql.createPool({
				'host':'localhost',
				'user':'root',
				'password':'123456',
				'database':'wp'
			});
	Pool.getConnection((err,c)=>{
		if(err){
			console.log(err);
			res.send({'ok':0,'msg':'Connection failed with the database.'});
			//c.end();
		}
		else{
			c.query('SELECT download FROM `allFiles` WHERE hashName="'+req.query.hash+'" AND user="'+req.query.user+'";',(err,data)=>{
				if(err){
					console.log(err);
					res.send({'ok':0,'msg':'Connection failed with the database.'});
					c.end();
				}
				else{
					//[{download:0}]
					var d = Number(data[0].download)+1;
					c.query('UPDATE `allFiles` SET download="'+d+'" WHERE hashName="'+req.query.hash+'" AND user="'+req.query.user+'";',(err,data)=>{
						if(err){
							console.log(err);
							res.send({'ok':0,'msg':'Connection failed with the database.'});
							c.end();
						}
						else{
							c.query('UPDATE `'+req.query.user+'` SET download="'+d+'" WHERE hashName="'+req.query.hash+'";',(err,data)=>{
								if(err){
									console.log(err);
									res.send({'ok':0,'msg':'Connection failed with the database.'});
									c.end();
								}
								else{
									res.send({'ok':1,'msg':'Download Succeeded!'});
								}
								c.end();
							})
						}
					})
				}
			})

		}

	})
});


//Show Page
showRouter.use('/showPage',(req,res)=>{
	res.setHeader('Access-Control-Allow-Origin','*');

	var Pool = mysql.createPool({
				'host':'localhost',
				'user':'root',
				'password':'123456',
				'database':'wp'
			});
	Pool.getConnection((err,c)=>{
		if(err){
			console.log(err);
			res.send({'ok':0,'msg':'Connection failed with the database.'});
			//c.end();
		}
		else{
			c.query('SELECT * FROM `allFiles`;',(err,data)=>{
				if(err){
					console.log(err);
					res.send({ok:0,data:'Connection failed.'});
				}
				else{
					res.send({ok:1,data:data})
				};
				c.end();
			})
		}


	})
});


//File upload API
loginRouter.use('/getfiles',(req,res)=>{
	res.setHeader('Access-Control-Allow-Origin','*');

	console.log(req.files)//{name:filsssss}
	var newName =req.files[0].path + path.parse(req.files[0].originalname).ext;
	var hashName = req.files[0].filename+ path.parse(req.files[0].originalname).ext;
	var thisTime = new Date().toLocaleDateString()+' '+new Date().toLocaleTimeString();
	fs.rename(req.files[0].path,newName,(err)=>{
		if(err){
			console.log(err);
		}
		else{
			var Pool = mysql.createPool({
				'host':'localhost',
				'user':'root',
				'password':'123456',
				'database':'wp'
			});
			Pool.getConnection((err,c)=>{
				if(err){
					console.log(err);
					res.send({'ok':0,'msg':'Connection failed with the database.'});
					c.end();
				}
				else{
					c.query('INSERT INTO `'+req.body.Fsnames+'` (`lastName`,`hashName`,`size`,`type`,`download`,`lastTime`) VALUES("'+req.files[0].originalname+'","'+hashName+'","'+req.files[0].size+'","'+path.parse(req.files[0].originalname).ext+'","0","'+thisTime+'");',(err,data)=>{
						if(err){
							console.log(err);
							res.send({'ok':0,'msg':'Failed to Upload the resource.'});
							c.end();

						}
						else{
							//
							c.query('INSERT INTO `allFiles` (`lastName`,`hashName`,`size`,`type`,`download`,`lastTime`,`user`) VALUES("'+req.files[0].originalname+'","'+hashName+'","'+req.files[0].size+'","'+path.parse(req.files[0].originalname).ext+'","0","'+thisTime+'","'+req.body.Fsnames+'");',(err,data)=>{
								if(err){
									console.log(err);
									res.send({'ok':0,'msg':'Failed to upload the resource.'});
								}
								else{
									res.send({'ok':1,'msg':'Upload succeeded!',hash:hashName,timer:thisTime});

								}
								c.end();

							})

						}
					})
					
				}
			})


		}
	})

});

//Register
loginRouter.use('/res',(req,res)=>{
	//console.log(req.query);
	res.setHeader('Access-Control-Allow-Origin','*');

	var Pool = mysql.createPool({
		'host':'localhost',
		'user':'root',
		'password':'123456',
		'database':'wp'
	});
	Pool.getConnection((err,c)=>{
		if(err){
			console.log(err);
			res.send({'ok':0,'msg':'Connection failed with the database.'});
		}
		else{
			c.query('SELECT user FROM `usertab` WHERE user="'+req.query.user+'";',(err,data)=>{
				if(err){
					console.log(err);
					res.send({'ok':0,'msg':'Connection failed.'});
					c.end();
				}
				else{
					if(data.length>0){
						res.send({'ok':0,'msg':'User Name already in use.'});
						c.end();
					}
					else{
						c.query('INSERT INTO `usertab` (`user`,`pass`) VALUES("'+req.query.user+'","'+req.query.pass+'");',(err,data)=>{
							if(err){
								console.log(err);
								res.send({'ok':0,'msg':'Connection failed with the database.'});
								c.end();
							}
							else{
								
								c.query(`CREATE TABLE ${req.query.user}
										(
										ID int(255) NOT NULL AUTO_INCREMENT,
										LastName varchar(255) NOT NULL,
										hashName varchar(255) NOT NULL,
										lastTime varchar(255) NOT NULL,
										type varchar(255),
										size varchar(255) NOT NULL,
										download varchar(255) NOT NULL,
										PRIMARY KEY (ID)
									)`,(err,data)=>{

									if(err){
										console.log(err);
									}
									else{
										res.send({'ok':1,'msg':'Registration Succeeded.'});
									};
									c.end();		


								})



							}	
							//c.end();
						})
					}
				}
			});
		}
	});
});

//Delete
loginRouter.use('/removeFile',(req,res)=>{
	//console.log(req.query)
	res.setHeader('Access-Control-Allow-Origin','*');

	fs.unlink('./wp/allFiles/'+req.query.hash,(err)=>{
		if(err){
			console.log(err);
			res.send({ok:0,msg:'Failed to delete the resource.'})
		}
		else{
			var Pool = mysql.createPool({
				'host':'localhost',
				'user':'root',
				'password':'123456',
				'database':'wp'
			});
			Pool.getConnection((err,c)=>{
				if(err){
					console.log(err);
					res.send({ok:0,msg:'Failed to delete the resource.'});
					//c.end();
				}
				else{
					c.query('DELETE FROM `'+req.query.user+'` WHERE hashName="'+req.query.hash+'";',(err,data)=>{
						if(err){
							console.log(err);
							res.send({ok:0,msg:'Failed to delete the resource.'});
							c.end();
						}
						else{
							c.query('DELETE FROM `allFiles` WHERE hashName="'+req.query.hash+'" AND user="'+req.query.user+'";',(err,data)=>{

								if(err){
									console.log(err);
									res.send({ok:0,msg:'Failed to delete the resource.'});

								}
								else{
									res.send({ok:1,msg:'Failed to delete the resource.'});

								};
								c.end();
							})

						};
						
					})
				}

			})

		}
	})
});


//Login
loginRouter.use('/login',(req,res)=>{
	//console.log(req.query);
	//console.log(1)
	res.setHeader('Access-Control-Allow-Origin','*');
	
	var Pool = mysql.createPool({
		'host':'localhost',
		'user':'root',
		'password':'123456',
		'database':'wp'
	});
	Pool.getConnection((err,c)=>{
		if(err){
			console.log(err);
			res.send({'ok':0,'msg':'Connection failed with the database.'});
		}
		else{
			c.query('SELECT user,pass FROM `usertab` WHERE user="'+req.query.user+'" AND pass="'+req.query.pass+'";',(err,data)=>{
				if(err){
					console.log(err);
					res.send({'ok':0,'msg':'Connection failed.'});
					c.end();
				}
				else{
					//[{user:leo,pass:123}]
					if(data.length>0){
						//
						c.query('SELECT LastName,hashName,size,lastTime,download FROM `'+req.query.user+'`;',(err,data)=>{
							if(err){
								console.log(err);
								res.send({'ok':0,'msg':'Connection failed with the database.'});
							}
							else{
								res.send({'ok':1,'msg':'Login Succeeded.','data':data});
							}
							c.end();
						});	
					}
					else{
						//[]
						res.send({'ok':0,'msg':'Error with the username or the password.'});
						c.end();
					}
					//c.end();
				}
			});
		}
	});
});

server.use('/',express.static('./wp'))
