const https = require('https')
var fs = require("fs");

var fsquery = {
		
	// https://stackoverflow.com/questions/31978347/fs-writefile-in-a-promise-asynchronous-synchronous-stuff
	write: function (filename, data) {
		return new Promise(function(resolve, reject) {
			fs.writeFile(filename, data, 'UTF-8', function(err) {
				if (err) reject(err);
				else resolve(data);
			});
		});
	},
	
	// https://stackoverflow.com/questions/34628305/using-promises-with-fs-readfile-in-a-loop
	read: function(filename) {
		return new Promise(function(resolve, reject) {
			fs.readFile(filename, 'UTF-8', function(err, data){
				if (err) 
					reject(err); 
				else 
					resolve(data);
			});
		});
	},
	
	// https://stackoverflow.com/questions/4482686/check-synchronously-if-file-directory-exists-in-node-js
	fileExists: function(filename) {
		try
		{
			return fs.statSync(filename).isFile();
		}
		catch (err)
		{
			if (err.code == 'ENOENT') { // no such file or directory. File really does not exist
			  console.log("File does not exist.");
			  return false;
			}
			return false; // something else went wrong, we don't have rights, ...
		}
	}
};
	
	
var httpquery = {
	
	getHttp: function(file) {
		return httpquery.request(file.host, file.path, "html");
	},
	
	getFile: function(file) {
		let type = file.type ? file.type : "json";
		return httpquery.request(file.host, file.path, type, undefined, "GET");
	},
	
	get: function(host, path) {
		return httpquery.request(host, path, "json", undefined, "GET");
	},
	
	postJson: function(host, path, object) {
		return httpquery.request(host, path, "json", object, 'POST');
	},
	
	patch: function(host, path, object) {
		return httpquery.request(host, path, "json", object, "PATCH");
	},
	
	request: function(host, path, kind, object, method) {
		return new Promise((resolve, reject) => {
			
			var data = undefined; 
			if (object != undefined) {
				data = JSON.stringify(object);
			}
			var options = {
				host: host,
				port: 443,
				path: path,
				method: method,
				headers: { }
			};
			if (data != undefined) {
				options.headers['Content-Type'] = 'application/json';
				options.headers['Content-Length'] = Buffer.byteLength(data);
			}
			
			if (httpquery.user) {
				options.headers["User-Agent"] = httpquery.user;
			}
			if (httpquery.password) {
				options.headers["Authorization"] = "Basic "+Buffer.from(httpquery.user+":"+httpquery.password).toString("base64");
			}
			
			console.log(options);
			var req = https.request(options, function(res) {
			    let body = '';
			    res.on('data', function(chunk) {
			    	body += chunk;
			    });
			    res.on('end', function() {
					if (kind == "json") {
						result = JSON.parse(body);
					} else {
						result = body;
					}
					resolve(result);
			    });
				
			}).on('error', function(e) {
				console.log("Got error: " + e.message);
				reject(e);
			});

			if (data != undefined) {
				req.write(data);
			}
			req.end();
		});
	}
};
	



const concat = (x,y) => x.concat(y)



var github = {

	//Create a new milestone on the configured repository
	createMilestone: function(milestone) {
		return httpquery.postJson("api.github.com", '/repos/'+github.config.repository+'/milestones', milestone);
	},
	
	//Get all existing milestones from the configured repository
	getMilestones: function() {
		return httpquery.get("api.github.com", '/repos/'+github.config.repository+'/milestones?state=all');
	},

	//Create given milestones if doesn't exist.
	//bugzillaMilestones, an array of wanted milestones
	createMilestones: function(bugzillaMilestones) {
		return new Promise((resolve, reject) => {

			github.getMilestones().then((miles) => {
				let existing=miles.map(m => m.title);
				let toCreate = bugzillaMilestones.filter( a => !existing.includes(a));
				
				console.log("Milestones to create:");
				console.log(toCreate);
				
				return Promise.all(toCreate.map(m => github.createMilestone({
					"title": m,
					"state": "open"
				}))).then(e => {
					github.getMilestones().then((allMiles) => {
						resolve(allMiles);
					}).catch(e => {
						reject(e);
					});
				}).catch(e => {
					reject(e);
				});

			}).catch(function e(ee) {
				reject(e);
			});
		});

	}
}

var bugzilla = {
	//parse an xml file and save it as a json
	parse2json: function(xmlFile, outputFile) {
		var convert = require('xml-js');

		fsquery.read(xmlFile).then(ee => {
			var result = convert.xml2json(ee, {compact: true, ignoreComment: true, spaces: 4});
			fsquery.write(outputFile, result);

		}).catch(ee => {
			console.log(ee);
		});
	},

	//Retrieve versions
	getUsedVersions: function(bug) {
		let result = [];
		if (bug.version != undefined && bug.version._text != undefined) {
			result.push(bug.version._text);
		}
		if (bug.target_milestone != undefined && bug.target_milestone._text != undefined) {
			result.push(bug.target_milestone._text);
		}
		result = result.filter(x => x != '---' && x != 'unspecified');
		return result;
	}, 
	
	getStatus: function(bug) {
		let result = "";
		if (bug.bug_status._text != undefined) {
			result = bug.bug_status._text.toLowerCase();
		}
		if (bug.resolution._text == "WONTFIX") {
			result = bug.resolution._text.toLowerCase();
		}
		return result;
	}, 
	
	getFullText: function(bug, onlyHeader) {
		let result = "";
		let comments = bug.long_desc.filter(x => x.thetext != undefined && x.thetext._text != undefined);
		
		comments = comments.filter(x => !x.thetext._text.startsWith("New Gerrit change created"));

		if (onlyHeader && comments.length > 0) {
			result += comments[0].thetext._text;
			
		} else {
			for (c=1; c<comments.length; c++) {
				let date = comments[c].bug_when._text.split(" ")[0];
				let quote = comments[c].thetext._text.replace(/\r\n/g, "\n");
				quote = "> "+quote.split("\n").join("\n > ");
				result+="**"+comments[c].who._text +"** commented on "+date +""+"\n"+quote;
				
				if (c<comments.length-1) {
					result+="\n\n";
				}
			}
		}
		
		result = result.replace(/http:\/\/git.polarsys.org\/c\/capella\/capella.git\/commit\/\?id=([^\n]+)/g, "[$1](https://github.com/"+bugzilla.config.repository+"/search?q=$1&type=Commits)");
		result = result.replace(/Gerrit change https:\/\/git.polarsys.org\/r\/\d+ was m/g, "M");
		result = result.replace(/(I[0-9a-z]{40})/g, "[$1](https://github.com/"+bugzilla.config.repository+"/search?q=$1&type=Commits)");
		result = result.replace(/\r\n/g, "\n");
		result = result.replace(/(genie commented )/g, "capella.bot commented ");
		return result;
	}
	
}

//bugzilla.parse2json("show_bug.cgi.xml", "bugs2.json");

fsquery.read("config.json").then(e => initConfig(JSON.parse(e))).catch(e => {
	console.log("Error");
});

function initConfig(config) {
	httpquery.user = config.user;
	httpquery.password = config.password;
	github.config = config;
	bugzilla.config = config;

	fsquery.read("bugs.json").then(function e(ee) {
		
		const obj = JSON.parse(ee);
		console.log(obj._doctype);
		
		let excludedComponents = [
			"XML Pivot" , "System2Subsystem", "RequirementsVP", "Perfo VP", "Price VP", "Mass VP", 
			"Groovy", "GenDoc HTML", "Forum", "Detachment", "Capella Studio"];

		let issues = obj.bugzilla.bug.filter(x => !excludedComponents.includes(x.component._text))

		let milestones = Array.from(new Set(issues.map(i => bugzilla.getUsedVersions(i)).reduce(concat, []))).sort();

		//remove 0.8 versions
		milestones = milestones.filter(v => v[0] != '0');

		github.createMilestones(milestones).then(miles => {
			console.log(e);
			
			//console.log(miles);
			issues = issues.filter(i => Array.isArray(i.long_desc)).filter(i => i.long_desc.length > 7);
			for (i=0; i<issues.length; i++) {
					
					let issue = {
						"title": issues[i].short_desc._text,
						"labels": []
					};
					let comments = {
						"body": bugzilla.getFullText(issues[i], false)
					};

					if (Array.isArray(issues[i].long_desc)) {
						issue.body = bugzilla.getFullText(issues[i], true);
					}

					issue.labels.push("severity-"+issues[i].bug_severity._text);
					
					let status = bugzilla.getStatus(issues[i]);
					issue.labels.push("status-"+bugzilla.getStatus(issues[i]));
					
					let mil = miles.find(x => x.title==issues[i].target_milestone._text);
					if (mil != null && mil != undefined){
						issue.milestone = mil.number;
					}
					console.log(issue);
					
					httpquery.postJson("api.github.com", '/repos/pdulth/tmp1/issues', issue).then(function e(ee) {
						if (comments.body.length>0) {
							httpquery.postJson("api.github.com", '/repos/pdulth/tmp1/issues/'+ee.number+'/comments', comments).then(function e(ee2) {
							}).catch(function e(ee2) {
								console.log(ee2);
							});
						}
					}).catch(function e(ee) {
						console.log(ee);
					});
					if (i==0) {
						return true;
					}
				}
			
			
		});

		//Create milestones
		
		
		
		
		/*
		httpquery.postJson("api.github.com", '/repos/pdulth/tmp1/issues', issue).then(function e(ee) {
			console.log(ee);
			
			let issue2 = {
				"state":"closed",
				"labels": [
				"to-delete"
				]
			};
			
			httpquery.patch("api.github.com", '/repos/pdulth/tmp1/issues/'+ee.number, issue2).then(function e(ddd) {
				console.log("OKOKOK");
				console.log(ddd);
				
			}).catch(function e(ee) {
				console.log("KOKOKO");
				console.log(ee);
			});
			
		}).catch(function e(ee) {
			console.log(ee);
		});
		*/
		
		
		
	}).catch(function e(ee) {
		console.log(ee);
	});






};

