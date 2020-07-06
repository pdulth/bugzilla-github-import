const https = require('https')
var fs = require("fs");

//helpers for files manipulation
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
	
	
//helpers for http requests
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
	
	put: function(host, path, object) {
		return httpquery.request(host, path, null, object, "PUT");
	},
	
	patch: function(host, path, object) {
		return httpquery.request(host, path, "json", object, "PATCH");
	},
	
	downloadFile : function(host, path, outputFile) {
		return new Promise((resolve, reject) => {
			var options = {
				host: host,
				port: 443,
				path: path
			};
		
			var file = fs.createWriteStream(outputFile);
			https.get(options, function(res) {
			res.on('data', function(data) {
				file.write(data);
			}).on('end', function() {
				file.end();
				resolve(outputFile);
			});
			}).on('error', function(e) {
				console.log("Got error: " + e.message);
				reject(e);
			});
		});
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
					//console.log(JSON.stringify(res.headers, null, " "));
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


var dueDates = {
	"v0.8.0":"2014-12-12T23:17:00Z",
	"v0.8.1":"2015-04-03T23:17:00Z",
	"v0.8.2":"2015-06-09T23:17:00Z",
	"v0.8.3":"2015-09-17T23:17:00Z",
	"v0.8.4":"2016-02-05T23:17:00Z",
	"v0.8.5":"2016-03-04T23:17:00Z",
	"v0.8.6":"2016-04-15T23:17:00Z",
	"v0.8.7":"2016-11-29T23:17:00Z",
	"v1.0.0":"2015-12-16T23:17:00Z",
	"v1.0.1":"2016-02-11T23:17:00Z",
	"v1.0.2":"2016-04-20T23:17:00Z",
	"v1.0.3":"2016-09-20T23:17:00Z",
	"v1.0.4":"2017-03-25T23:17:00Z",
	"v1.1.0":"2016-11-09T23:17:00Z",
	"v1.1.1":"2017-03-28T23:17:00Z",
	"v1.1.2":"2017-08-01T23:17:00Z",
	"v1.1.3":"2017-11-02T23:17:00Z",
	"v1.1.4":"2018-03-20T23:17:00Z",
	"v1.2.0":"2017-11-03T23:17:00Z",
	"v1.2.1":"2018-06-01T23:17:00Z",
	"v1.2.2":"2018-12-06T23:17:00Z",
	"v1.3.0":"2018-10-30T23:17:00Z",
	"v1.3.1":"2019-05-20T23:17:00Z",
	"v1.4.0":"2019-11-21T23:17:00Z",
};

var github = {

	//Create a new milestone on the configured repository
	createMilestone: function(milestone) {
		return httpquery.postJson("api.github.com", '/repos/'+github.config.repository+'/milestones', milestone);
	},
	
	//Get all existing milestones from the configured repository
	getMilestones: function() {
		return new Promise((resolve, reject) => {
			//we suppose that there is at most 3 pages of milestones
			return Promise.all([1, 2, 3].map(m => httpquery.get("api.github.com", '/repos/'+github.config.repository+'/milestones?state=all&page='+m))).then(e => {
				resolve(e.reduce(function (arr, row) {
					return arr.concat(row);
				  }, []));
			}).catch(e => {
				reject(e);
			});
		});
	},

	//Create given milestones if doesn't exist.
	//bugzillaMilestones, an array of wanted milestones
	createMilestones: function(bugzillaMilestones) {
		return new Promise((resolve, reject) => {

			github.getMilestones().then((miles) => {

				let existing=miles.map(m => m.title);

				console.log("Milestones existing:");
				console.log(existing);
				

				let toCreate = bugzillaMilestones.filter( a => !existing.includes(a));
				
				console.log("Milestones to create:");
				console.log(toCreate);
				
				if (toCreate.length == 0) {
					github.getMilestones().then((allMiles) => {
						resolve(allMiles);
					}).catch(e => {
						reject(e);
					});
				} else {
					return Promise.all(toCreate.map(m => github.createMilestone({
						"title": m,
						"state": "open",
						"due_on": dueDates[m]
					}))).then(e => {
						reject("There is still milestones to create");
					}).catch(e => {
						reject(e);
					});
				}
			}).catch(function e(ee) {
				reject(ee);
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

	//Retrieve versions for a bugzilla
	getUsedVersions: function(bug) {
		let result = [];
		let product = bug.product._text;
		let productId = "";

		let component = bug.component._text;
		component = component.replace(/VP/g, " ").trim();
		component = component.replace(/(Perfo|Price|Mass)/g, "Basic VP");

		let addons = [
			"XML Pivot" , "System2Subsystem", "Filtering", "RequirementsVP", "Perfo VP", "Price VP", "Mass VP", 
			"Groovy", "GenDoc HTML", "Capella Studio"
		];

		if (addons.includes(bug.component._text)) {
			productId = component;
		} else {
			productId = product;
		}
		if (bug.version != undefined && bug.version._text != undefined) {
			result.push(bug.version._text);
		}
		if (bug.target_milestone != undefined && bug.target_milestone._text != undefined) {
			result.push(bug.target_milestone._text);
		}
		result = result.filter(x => x != '---' && x != 'unspecified');
		result = result.map(x => "v"+x);
		return result;
	}, 
	
	getTargetVersion: function(bug) {
		return "v"+bug.target_milestone._text;
	},

	//retrieve the status (mix between status and resolution fields)
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

	//retrieve a trigramm of the given user from bugzilla
	who: function(who) {
		let user = who._attributes.name.toLowerCase().replace(/ /g, ".");

		if (user == "nobody.-.feel.free.to.take.it") return "anonymous";
		if (user == "eclipse.webmaster") return "webmaster";
		if (user == "polarsys.genie") return "ci-bot";

		if (user.indexOf(".")>0) {
			user = user.split(".")[0][0]+user.split(".")[1].substring(0, 2);
		}
		//Some custom trigram
		if (user == "mtu") user = "tto";
		if (user == "gde") user = "sde";
		if (user == "cba") user = "cbd";
		return user;
	},
	
	//retrieve a label for the component of the bugzilla issue
	labelComponent: function(issue) {
		return issue.component._text.replace(/[\/ ]/g, "-").toLowerCase();
	},
	
	//retrieve a label for the product of the bugzilla issue
	labelProduct: function(issue) {
		return issue.product._text.toLowerCase();
	},
	
	getFullText: function(bug, onlyHeader) {
		let result = "";
		let comments = bug.long_desc.filter(x => x.thetext != undefined && x.thetext._text != undefined);
		
		comments = comments.filter(x => !x.thetext._text.startsWith("New Gerrit change created"));
		
		if (onlyHeader && comments.length > 0) {
			let date = comments[0].bug_when._text.split(" ")[0];
			let quote = comments[0].thetext._text.replace(/\r\n/g, "\n");

			quote = quote.replace(/Created attachment (\d*)/g, (match, p1, p2) => {
				let attachment=bug.attachment.filter(a => a.date._text == comments[0].bug_when._text)[0];
				if (attachment != null) {
					let file = bugzilla.attachmentName(attachment);
					let image = bugzilla.isAttachmentImage(attachment) ? "!": "Attachment: ";
					return `${image}[${attachment.filename._text}](https://raw.githubusercontent.com/wiki/${bugzilla.config.repository}/attachments/${file})`;
				}
				return "See attachment";
			});

			let who = bugzilla.who(comments[0].who);
			if (comments[0].thetext._text.trim().length > 0) {
				result += quote+"\n\n";
			}

			result += "`ECLIPSE-"+bug.bug_id._text+"` `POLARSYS-"+bug.status_whiteboard._text+"` `@"+who+"` `"+date+"`";
			
		} else {
			for (c=1; c<comments.length; c++) {
				let date = comments[c].bug_when._text.split(" ")[0];
				let quote = comments[c].thetext._text.replace(/\r\n/g, "\n");
				let who = bugzilla.who(comments[c].who);
				
				quote = "> "+quote.split("\n").join("\n > ");

				quote = quote.replace(/Created attachment (\d*)/g, (match, p1, p2) => {
					let attachment=bug.attachment.filter(a => a.date._text == comments[c].bug_when._text)[0];
					if (attachment != null) {
						let file = bugzilla.attachmentName(attachment);
						let image = bugzilla.isAttachmentImage(attachment) ? "!": "Attachment: ";
						return `${image}[${attachment.filename._text}](https://raw.githubusercontent.com/wiki/${bugzilla.config.repository}/attachments/${file})`;
					}
					return "See attachment";
				});
				
				result+="**"+who +"** commented on "+date +""+"\n"+quote;
				
				if (c<comments.length-1) {
					result+="\n\n";
				}
			}
		}

		result = result.replace(/^[\r\n]*/, ""); //Remove initial \n
		result = result.replace(/[\r\n]*$/, ""); //Remove ending \n
		
		result = result.replace(/^\tat/g, "  "); //Remove Build #XX hyperlink
		result = result.replace(/uild #(\d+)/g, "uild $1"); //Remove Build #XX hyperlink
		result = result.replace(/[bB]ug \[?(\d+)\]?/g, "[POLARSYS-$1](https://github.com/search?q=POLARSYS-$1&type=Issues)"); //Add search to Bug #xxx
		result = result.replace(/https:\/\/bugs.eclipse.org\/bugs\/show_bug.cgi\?id=([^\n]+)/g, "[ECLIPSE-$1](https://github.com/search?q=ECLIPSE-$1&type=Issues)"); //](https://github.com/search?q=$1&type=Issues)
		result = result.replace(/https:\/\/polarsys.org\/bugs\/show_bug.cgi\?id=([^\n]+)/g, "[POLARSYS-$1](https://github.com/search?q=POLARSYS-$1&type=Issues)"); //](https://github.com/search?q=$1&type=Issues)
		result = result.replace(/http:\/\/git.polarsys.org\/c\/(kitalpha|capella)\/([^\.]+).git\/commit\/\?id=([^\n]+)/g, "[$3](https://github.com/search?q=$3&type=Commits)");
		result = result.replace(/Gerrit change https:\/\/git.polarsys.org\/r\/\d+ was m/g, "M");
		result = result.replace(/(I[0-9a-z]{40})/g, "[$1](https://github.com/search?q=$1&type=Commits)");
		result = result.replace(/\r\n/g, "\n");
		result = result.replace(/(genie commented )/g, "ci-bot commented ");
		return result;
		
	},

	// for a given attachment, retrieve its new name
 	attachmentName: function(attachment) {
		let extension = attachment.filename._text.split(".");
		extension = extension[extension.length-1];
		let file = attachment.attachid._text+"."+extension;
		return file;
	},

	// for a given attachment, retrieve if it is an image (to be able to display the image instead of a link)
	isAttachmentImage: function(attachment) {
		let extension = attachment.filename._text.split(".");
		extension = extension[extension.length-1].toLowerCase();
		return extension == "jpg" || extension == "png";
	},

	//download an attachment to the attachments/ folder
	downloadAttachment: function(issue, attachment) {
		return new Promise((resolve, reject) => {
			let file = bugzilla.attachmentName(attachment);
			httpquery.downloadFile("bugs.eclipse.org", "/bugs/attachment.cgi?id="+attachment.attachid._text, "attachments/"+file).then(e => resolve(e)).catch(e => reject(e));
		});
	},

	//download all attachments for the given issue
	downloadAttachments: function(issue) {
		return new Promise((resolve, reject) => {
			return Promise.all(issue.attachment.map(m => bugzilla.downloadAttachment(issue, m))).then(e => {
				resolve(e.reduce(function (arr, row) {
					return arr.concat(row);
				}, []));
			}).catch(e => {
				reject(e);
			});
		});
	}
}


//based on the latests github issues, and the all issues from bugzilla, create the next batch of issues to github
function createIssues(ghIssues, issues, miles) {

	console.log(JSON.stringify(ghIssues[0], null, "  "));
	let last = ghIssues.length == 0 ? 1 : Number(ghIssues[0].body.match(/POLARSYS-(\d+)/g)[0].split("-")[1]) + 1;
	//let last = ; //ghIssues.length == 0 ? 1 : ghIssues[0].number + 1;

	console.log("LAST="+last);
	//Retrieve the next bugzilla polarsys id we want to create
	let nextIds = Array(100).fill(0).map((e,i)=>i+last);
	console.log(nextIds);
	
	//Filter to existing issues
	nextIds = nextIds.filter(id => issues.find(i => i.status_whiteboard != null && ""+i.status_whiteboard._text.trim() == (""+id).trim()) != undefined);
	
	console.log(nextIds.length);
	
	
	if (true) {
	nextIds.reduce((p, theFile) => {
		return p.then(() => {
			return createClosedIssue(theFile, issues, miles); //function returns a promise
		}).catch(error => {
			console.log(error);
		});
	}, Promise.resolve()).then(()=>{
		console.log("All files transferred");
	}).catch(error => {
		console.log(error);
	});
	
	}

}

function createMilestoneIssue(id, issues, miles) {
	return new Promise((resolve, reject) => {
		createIssue(id, issues, miles).then(ee => {
			
			if (ee != undefined) {
				let bissue = issues.find(i => i.status_whiteboard != null && ""+i.status_whiteboard._text.trim() == (""+id).trim());
				let milestone = miles.find(x => x.title==bugzilla.getTargetVersion(bissue));
				if (milestone != null && milestone != undefined) {
					setTimeout(function () {		
						httpquery.patch("api.github.com", `/repos/${bugzilla.config.repository}/issues/${ee.number}`, { milestone : milestone.number }).then(ddd => {
							resolve(ee);
						}).catch(error => {
							reject(ee);
						});
					}, Math.round(Math.random()*500)+200);
				} else {
					resolve(ee);
				}
			} else {
				resolve(ee);
			}
		}).catch(error => {
			reject(error);
		});
	});
}

//create closed issues (same as createIssues, but closed)
function createClosedIssue(id, issues, miles) {
	return new Promise((resolve, reject) => {
		createMilestoneIssue(id, issues, miles).then(ee => {
			if (ee != undefined) {
				setTimeout(function () {
					httpquery.patch("api.github.com", `/repos/${bugzilla.config.repository}/issues/${ee.number}`, { "state":"closed" }).then(ddd => {
						resolve(ee);
					}).catch(error => {
						reject(ee);
					});
				}, Math.round(Math.random()*500)+200);
			} else {
				resolve(ee);
			}
		}).catch(error => {
			reject(error);
		});
	});
}

//create locked closed issues (same as createIssues, but locked and closed)
function createLockedIssue(id, issues, miles) {
	return new Promise((resolve, reject) => {
		createClosedIssue(id, issues, miles).then(ee => {
			if (ee != undefined) {
				httpquery.put("api.github.com", `/repos/${bugzilla.config.repository}/issues/${ee.number}/lock`, null).then(function aaa(ddd) {
					resolve(ee);
				}).catch(error => {
					reject(ee);
				});
			} else {
				resolve(ee);
			}
		}).catch(error => {
			reject(error);
		});
	});

}

//create the given issue based on its polarsys id (whiteboard field)
function createIssue(id, issues, miles) {
	let createUnknown = false;

	return new Promise((resolve, reject) => {
		let bissue = issues.find(i => i.status_whiteboard != null && ""+i.status_whiteboard._text.trim() == (""+id).trim());
		if (bissue == undefined && !createUnknown) {
			resolve(undefined);
			return;
		}
		setTimeout(function () {
			console.log(id);
			
			if (bissue == undefined) {
				console.log("create unknown issue");
				let issue = {
					"title": "Issue not related to Capella",
					"labels": ["to-delete"]
				};
				httpquery.postJson("api.github.com", `/repos/${bugzilla.config.repository}/issues`, issue).then(ee => {
					resolve(ee);
				}).catch(ee => {
					reject(ee);
				});

			} else {
				console.log(bissue.bug_id._text);
				let issue = {
					"title": bissue.short_desc._text,
					"labels": []
				};
				let comments = {
					"body": bugzilla.getFullText(bissue, false)
				};
				issue.body = bugzilla.getFullText(bissue, true);

				issue.labels.push(bugzilla.labelProduct(bissue));
				issue.labels.push(bugzilla.labelComponent(bissue));
				issue.labels.push(bissue.bug_severity._text);
				issue.labels.push(bugzilla.getStatus(bissue));
				
				console.log(JSON.stringify(issue, null, " "));
				
				httpquery.postJson("api.github.com", `/repos/${bugzilla.config.repository}/issues`, issue).then(ee => {
					
					//post comments if any. we wait a bit, otherwise labels are logged after comments
					if (comments.body.length>0) {
						setTimeout(function () {
							httpquery.postJson("api.github.com", `/repos/${bugzilla.config.repository}/issues/${ee.number}/comments`, comments).then(ee2 => {
								resolve(ee);
							}).catch(ee2 => {
								reject(ee);
							});
						}, Math.round(Math.random()*2000)+670);
					} else {
						resolve(ee);
					}
				}).catch(error => {
					reject(error);
				});
			}
		}, Math.round(Math.random()*2000)+940);
	});
}

//Load configuration and proceed
fsquery.read("config.json").then(e => proceed(JSON.parse(e))).catch(e => { console.log(e); });

function proceed(config) {
	httpquery.user = config.user;
	httpquery.password = config.password;

	github.config = config;
	bugzilla.config = config;
	
	//bugzilla.parse2json("show_bug.cgi.xml", "bugs2.json");
	//if (true) return;
	
	//List contributors of the given repository
	/*
	httpquery.get("api.github.com", '/repos/eclipse/capella/contributors').then(function e(ee) {
		console.log(ee.map(x => x.login).join(","));
	});
	*/

	//Load attachments for a given repository
	/*
	fsquery.read(bugsFile).then(ee => {
		
		const obj = JSON.parse(ee);
		console.log(obj._doctype);
		let issues = obj.bugzilla.bug;

		let includedProducts = [ "Capella", "Kitalpha" ];
		issues = issues.filter(x => includedProducts.includes(x.product._text));
		
		issues.filter(i => i.attachment != undefined && !Array.isArray(i.attachment)).forEach(i => i.attachment = [i.attachment]); //.filter(i => i.long_desc.length > 7);
		issues.filter(i => i.attachment != undefined).forEach(i => bugzilla.downloadAttachments(i)); //.filter(i => i.long_desc.length > 7);
		
		//fsquery.write("bugs-polarsys-repo.json", result);
	});
	*/

	//if (true) return;

	//Load issues
	fsquery.read("bugs-polarsys.json").then(json => {
		
		let includedProducts = [ "Capella" ]; // "Kitalpha"
		
		let includedComponents = [
			'Capella Gitadapter', 'Core', 'Detachment', 'Diagram', 'Diff-Merge',
			'Documentation', 'General', 'Groovy', 'Library',
			'ModelValidation', 'Patterns', 'Properties',
			'Rec-Rpl', 'Releng', 'Test framework',
			'Transition', 'UI'
		];
		/*let includedComponents = [
			'RequirementsVP'
		];*/

		//all (unused, just for information)
		let allComponents2 = [ 
			'Capella Gitadapter', 'Capella Studio', 'Core', 'Detachment', 'Diagram', 'Diff-Merge',
			'Documentation', 'Forum', 'GenDoc HTML', 'General', 'Groovy', 'Library',
			'Mass VP', 'ModelValidation', 'Patterns', 'Perfo VP', 'Price VP', 'Properties',
			'Rec-Rpl', 'Releng', 'RequirementsVP', 'System2Subsystem', 'Test framework',
			'Transition', 'UI', 'Website', 'XML Pivot' 
		];

		let issues = JSON.parse(json).bugzilla.bug;
		console.log(issues.length);
		
		issues = issues.filter(i => includedProducts.includes(i.product._text));
		console.log(issues.length);
		
		let allComponents =  Array.from(new Set(issues.map(i => i.component._text).sort()));
		console.log("All components");
		console.log(allComponents);
		
		issues = issues.filter(i => includedComponents.includes(i.component._text));
		console.log(issues.length);
		
		let products = Array.from(new Set(issues.map(i => i.product._text).sort()));
		console.log("Keeped products");
		console.log(products);

		let components =  Array.from(new Set(issues.map(i => i.component._text).sort()));
		console.log("Keeped components");
		console.log(components);
		
		let milestones = Array.from(new Set(issues.map(i => bugzilla.getUsedVersions(i)).reduce(concat, []))).sort();

		//create a default array of [description] if empty or if only one description
		issues.filter(i => i.long_desc == undefined).forEach(i => i.long_desc = 
		[{
            "who": {
				"_attributes": { "name": i.reporter._attributes.name },
                "_text": i.reporter._text
            },
            "bug_when": { "_text": i.creation_ts._text  },
            "thetext": {  "_text": ""  }
        }]);
		issues.filter(i => !Array.isArray(i.long_desc)).forEach(i => i.long_desc = [i.long_desc]); //.filter(i => i.long_desc.length > 7);
		
		//create an array of attachments
		let hasAttachs = issues.filter(i => i.attachment != undefined).length;
		console.log("Issues with attachments:"+hasAttachs);

		issues.filter(i => i.attachment != undefined && !Array.isArray(i.attachment)).forEach(i => i.attachment = [i.attachment]); //.filter(i => i.long_desc.length > 7);
		
		//issues = issues.map(i => i.status_whiteboard._text).sort().join("\n");
		//console.log(issues);
		console.log(milestones);

		//Users
		//console.log(Array.from(new Set(issues.filter(i => i.long_desc.length > 4).map(i => i.long_desc[4].who._attributes.name+" "+bugzilla.who(i.long_desc[4].who)))));

		github.createMilestones(milestones).then(miles => {
			console.log(miles);
			httpquery.get("api.github.com", `/repos/${github.config.repository}/issues?state=all`)
				.then( ghIssues => createIssues(ghIssues, issues, miles)).catch(ee => {
					console.log("error");
					console.log(ee);
			});
			
		}).catch(error => {
			console.log(error);
		});
		
	}).catch(error => {
		console.log(error);
	});





};

