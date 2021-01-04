/*******************************************************************************
 * Copyright (c) 2020, 2021 THALES GLOBAL SERVICES.
 * 
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0
 * 
 * SPDX-License-Identifier: EPL-2.0
 * 
 * Contributors:
 *    Thales - initial API and implementation
 *******************************************************************************/
 const https = require('https')
var fs = require("fs");

//helpers for files manipulation
var fsquery = {
		
	write: function (filename, data) {
		return new Promise(function(resolve, reject) {
			fs.writeFile(filename, data, 'UTF-8', function(err) {
				if (err) reject(err);
				else resolve(data);
			});
		});
	},
	
	read: function(filename) {
		return new Promise(function(resolve, reject) {
			fs.readFile(filename, 'UTF-8', function(err, data){
				if (err) reject(err); 
				else resolve(data);
			});
		});
	}
};

//helpers for http requests
var httpq = {
	
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

	request: function(host, path, kind, object, method, user, password) {
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
			
			if (user) {
				options.headers["User-Agent"] = user;
			}
			if (password) {
				options.headers["Authorization"] = "Basic "+Buffer.from(user+":"+password).toString("base64");
			}
			
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
					if (result != undefined && result.message != undefined && result.message.includes("Bad credentials")) {
						reject(result);
					} else {
						resolve(result);
					}
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

//helpers for http requests for user without commiter rights
//credentials are set while config load.
var httpquery = {
	
	get: function(host, path) {
		return httpq.request(host, path, "json", undefined, "GET", httpquery.user, httpquery.password);
	},
	
	postJson: function(host, path, object) {
		return httpq.request(host, path, "json", object, 'POST', httpquery.user, httpquery.password);
	},
	
	put: function(host, path, object) {
		return httpq.request(host, path, null, object, "PUT", httpquery.user, httpquery.password);
	},
	
	patch: function(host, path, object) {
		return httpq.request(host, path, "json", object, "PATCH", httpquery.user, httpquery.password);
	}
};

//helpers for http requests for user with commiter rights
//credentials are set while config load.
var httpqueryc = {
	
	get: function(host, path) {
		return httpq.request(host, path, "json", undefined, "GET", httpqueryc.user, httpqueryc.password);
	},
	
	postJson: function(host, path, object) {
		return httpq.request(host, path, "json", object, 'POST', httpqueryc.user, httpqueryc.password);
	},
	
	put: function(host, path, object) {
		return httpq.request(host, path, null, object, "PUT", httpqueryc.user, httpqueryc.password);
	},
	
	patch: function(host, path, object) {
		return httpq.request(host, path, "json", object, "PATCH", httpqueryc.user, httpqueryc.password);
	}
};


const concat = (x,y) => x.concat(y)

//From an array of values and a function returning a promise from a value
//Execute promises sequentially (Promise.all doesn't run sequentially)
function consecutive(values, fPromise) {
	return values.reduce((p, value) => {
		return p.then(() => {
			return fPromise(value);
		}).catch(error => {
			console.log(error);
		});
	}, Promise.resolve());
}

// dates of milestones
var dueDates = {
	"0.8.0":"2014-12-12T23:17:00Z",
	"0.8.1":"2015-04-03T23:17:00Z",
	"0.8.2":"2015-06-09T23:17:00Z",
	"0.8.3":"2015-09-17T23:17:00Z",
	"0.8.4":"2016-02-05T23:17:00Z",
	"0.8.5":"2016-03-04T23:17:00Z",
	"0.8.6":"2016-04-15T23:17:00Z",
	"0.8.7":"2016-11-29T23:17:00Z",
	"1.0.0":"2015-12-16T23:17:00Z",
	"1.0.1":"2016-02-11T23:17:00Z",
	"1.0.2":"2016-04-20T23:17:00Z",
	"1.0.3":"2016-09-20T23:17:00Z",
	"1.0.4":"2017-03-25T23:17:00Z",
	"1.1.0":"2016-11-09T23:17:00Z",
	"1.1.1":"2017-03-28T23:17:00Z",
	"1.1.2":"2017-08-01T23:17:00Z",
	"1.1.3":"2017-11-02T23:17:00Z",
	"1.1.4":"2018-03-20T23:17:00Z",
	"1.2.0":"2017-11-03T23:17:00Z",
	"1.2.1":"2018-06-01T23:17:00Z",
	"1.2.2":"2018-12-06T23:17:00Z",
	"1.3.0":"2018-10-30T23:17:00Z",
	"1.3.1":"2019-05-20T23:17:00Z",
	"1.3.2":"2020-02-14T09:48:00Z",
	"1.3.3":"2020-07-20T15:36:00Z",
	"1.4.0":"2019-11-21T23:17:00Z",
	"1.4.1":"2020-06-30T16:03:00Z",
	"1.4.2":"2020-10-14T09:08:00Z",
};

var github = {

	//Create a new milestone on the configured repository
	createMilestone: function(milestone) {
		console.log(`create: ${milestone.title}`);
		return httpqueryc.postJson("api.github.com", '/repos/'+github.config.repository+'/milestones', milestone);
	},
	
	//Get all existing milestones from the configured repository
	getMilestones: function() {
		return new Promise((resolve, reject) => {
			//we suppose that there is at most 3 pages of milestones
			return Promise.all([1, 2, 3].map(m => httpquery.get("api.github.com", '/repos/'+github.config.repository+'/milestones?state=all&page='+m))).then(e => {
				let resultPages = e.reduce(function (arr, row) {
					return arr.concat(row);
				  }, []);
				resolve(resultPages);
			}).catch(e => {
				reject(e);
			});
		});
	},

	//Create given milestones if doesn't exist.
	//bugzillaMilestones, an array of wanted milestones
	createMilestones: function(bugzillaMilestones) {

		return github.getMilestones()
		.then((miles) => {
			let existing=miles.map(m => m.title);
			console.log("Milestones existing:");
			console.log(existing);
			
			let toCreate = bugzillaMilestones.filter( a => !existing.includes(a));
			return Promise.resolve(toCreate);
		}).then(toCreate => {
			if (toCreate.length == 0) {
				return Promise.resolve();
			} else {
				return consecutive(toCreate, m => github.createMilestone({
					"title": m,
					"state": "open",
					"due_on": dueDates[m]
				}).then(wait));
			}

		}).then(e => {
			return github.getMilestones();
		});
	},

	createGithubIssue: function(issue) {
		return new Promise((resolve, reject) => {
			let createParameters = {
				"title": issue.title,
				"labels": [],
				"body": issue.body
			}
			httpquery.postJson("api.github.com", `/repos/${bugzilla.config.repository}/issues`, createParameters).then(ee => {
				issue.githubId = ee.number;
				issue.url = ee.url;
				resolve(issue);

			}).catch(error => {
				reject(error);
			});
		});
	},

	addGithubLabels: function(issue) {
		return new Promise((resolve, reject) => {
			httpqueryc.postJson("api.github.com", `/repos/${bugzilla.config.repository}/issues/${issue.githubId}`, { "labels": issue.labels } ).then(ee => {
				resolve(issue);
			}).catch(error => {
				reject(error);
			});
		});
	},

	postGithubComments: function(issue) {
		return new Promise((resolve, reject) => {
			if (issue.comments.body.length > 0) {
				httpquery.postJson("api.github.com", `/repos/${bugzilla.config.repository}/issues/${issue.githubId}/comments`, issue.comments).then(ee => {
					resolve(issue);
				}).catch(error => {
					reject(error);
				});
			} else {
				resolve(issue);
			}
		});
	},

	addGithubMilestone: function(miles, issue) {
		return new Promise((resolve, reject) => {
			if (issue.milestoneId != null) {
				httpqueryc.patch("api.github.com", `/repos/${bugzilla.config.repository}/issues/${issue.githubId}`, { milestone : issue.milestoneId }).then(ee => {
					resolve(issue);
				}).catch(error => {
					reject(error);
				});
			} else {
				resolve(issue);
			}
		});
	},

	closeIssue: function(issue) {
		return new Promise((resolve, reject) => {
			if (issue.closeable) {
				httpquery.patch("api.github.com", `/repos/${bugzilla.config.repository}/issues/${issue.githubId}`, { "state": "closed" }).then(ee => {
					issue.state = "closed";
					console.log("https://bugs.eclipse.org/bugs/show_bug.cgi?id="+issue.bugzillaId);
					console.log(issue.url);
					console.log("close issue "+issue.bugzillaId+"\n\n");
					resolve(issue);
					
				}).catch(error => {
					reject(error);
				});
			} else {
				console.log("kept opened "+issue.bugzillaId+"\n\n");
				resolve(issue);
			}
		});
	},

	lockIssue: function(issue) {
		return new Promise((resolve, reject) => {
			httpquery.put("api.github.com", `/repos/${bugzilla.config.repository}/issues/${issue.githubId}/lock`, null).then(ee => {
				resolve(issue);
			}).catch(error => {
				reject(error);
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
		if (bug.version != undefined && bug.version._text != undefined) {
			result.push(bug.version._text);
		}
		if (bug.target_milestone != undefined && bug.target_milestone._text != undefined) {
			result.push(bug.target_milestone._text);
		}
		result = result.filter(x => x != '---' && x != 'unspecified');
		result = result.map(x => ""+x);
		return result;
	}, 
	
	getDetectedVersion: function(bug) {
		let version = bug.version._text;
		if (version == "unspecified" || version == "---") {
			return null;
		}
		return ""+version;
	},

	getTargetVersion: function(bug) {
		let version = bug.target_milestone._text;
		if (version == "unspecified" || version == "---") {
			// If there is no target milestone, some products and components are using the version field instead.
			let productsWithVersionAsTarget = [ "Kitalpha" ];
			let componentsWithVersionAsTarget = [ "Capella Studio", "GenDoc HTML", "Mass VP", "Perfo VP", "Price VP" ];

			if (bug.bug_status._text == "RESOLVED" || bug.bug_status._text == "VERIFIED" || bug.bug_status._text == "CLOSED") {
				if (productsWithVersionAsTarget.includes(bug.product._text)) {
					version = bug.version._text;
				} else if (componentsWithVersionAsTarget.includes(bug.component._text)) {
					version = bug.version._text;
				} else {
					console.log("A closed issue with no target version (may be an issue or not): "+bug.bug_id._text);
				}
			}
		}
		if (version == "unspecified" || version == "---") {
			return null;
		}
		return ""+version;
	},

	// retrieve the status (mix between status and resolution fields)
	getStatus: function(bug) {
		let result = "";
		if (bug.bug_status._text != undefined) {
			result = bug.bug_status._text;
		}
		if (bug.resolution._text == "WONTFIX") {
			result = bug.resolution._text;
		} else if (bug.resolution._text == "DUPLICATE") {
			result = bug.resolution._text;
		} else if (bug.resolution._text == "INVALID") {
			result = bug.resolution._text;
		} else if (bug.resolution._text == "WORKSFORME") {
			result = bug.resolution._text;
		}
		return result.toLowerCase();
	}, 

	//retrieve a trigram of the given user from bugzilla
	who: function(who) {
		return bugzilla.trigram(who._attributes.name);
	},
	
	trigram: function(user) {
		user = user.toLowerCase().replace(/ /g, ".");
		if (user == "nobody.-.feel.free.to.take.it") return "anonymous";
		if (user == "polarsys.webmaster") return "webmaster";
		if (user == "eclipse.webmaster") return "webmaster";
		if (user == "polarsys.genie") return "ci-bot";
		if (user == "eclipse.genie") return "ci-bot";

		//if (user.indexOf(".")>0) {
		//	user = user.split(".")[0][0]+user.split(".")[1].substring(0, 2);
		//}
		//Some custom trigram
		//if (user == "mtu") user = "tto";
		//if (user == "gde") user = "sde";
		//if (user == "cba") user = "cbd";
		return user;
	},

	//retrieve a label for the component of the bugzilla bug
	labelComponent: function(bug) {
		return bug.component._text;
	},
	
	//retrieve a label for the product of the bugzilla bug
	labelProduct: function(bug) {
		return bug.product._text;
	},
	
	getComments: function(bug) {
		let comments = bug.long_desc.filter(x => x.thetext != undefined && x.thetext._text != undefined);
		comments = comments.filter(x => !x.thetext._text.startsWith("New Gerrit change created"));
		return comments;
	},

	getReporter: function(bug) {
		return bugzilla.who(bug.reporter);
	},

	getFullText: function(bug, onlyHeader, issue) {
		let result = "";
		let comments = bugzilla.getComments(bug);

		if (onlyHeader && comments.length > 0) {
			let date = comments[0].bug_when._text.split(" ")[0];
			let quote = comments[0].thetext._text.replace(/\r\n/g, "\n");

			quote = quote.replace(/Created attachment (\d*)/g, (match, p1, p2) => {
				let attachment=bug.attachment.filter(a => a.date._text == comments[0].bug_when._text)[0];
				if (attachment != null) {
					let file = bugzilla.attachmentName(attachment);
					let image = bugzilla.isAttachmentImage(attachment) ? "!": "Attachment: ";
					return `${image}[${attachment.filename._text}](https://raw.githubusercontent.com/wiki/eclipse/capella/attachments/${file})`;
				}
				return "See attachment";
			});

			if (comments[0].thetext._text.trim().length > 0) {
				result += quote+"\n\n";
			}
			if (bug.status_whiteboard._text != null && bug.status_whiteboard._text.trim().length > 0) {
				result += "`🆔 ECLIPSE-"+bug.bug_id._text+" / POLARSYS-"+bug.status_whiteboard._text+"` ";
			} else {
				result += "`🆔 ECLIPSE-"+bug.bug_id._text+"` ";
			}
			result += "`👷 "+issue.reporter+"` `📅 "+date+"` ";

			let version = issue.version;
			if (version != null) {
				result += "`🔎 "+version+"`";
			}
			
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
						return `${image}[${attachment.filename._text}](https://raw.githubusercontent.com/wiki/eclipse/capella/attachments/${file})`;
					}
					return "See attachment";
				});
				
				result+="**"+who +"** commented on "+date +""+"\n"+quote;
				
				if (c<comments.length-1) {
					result+="\n\n";
				}
			}
		}

		result = result.replace(/In reply to ([^\n]+) from/g, (match, p1, p2) => {
			return "In reply to "+bugzilla.trigram(p1)+" from";
		});

		result = result.replace(/^[\r\n]*/, ""); //Remove initial \n
		result = result.replace(/[\r\n]*$/, ""); //Remove ending \n
		
		result = result.replace(/^\tat/g, "  at"); //exception stackstrace tab to spaces
		result = result.replace(/uild #(\d+)/g, "uild $1"); //Remove Build #XX hyperlink
		result = result.replace(/[bB]ug \[?(\d{6})\]?/g, "[ECLIPSE-$1](https://github.com/search?q=ECLIPSE-$1&type=Issues)"); //Add search to Bug #xxx (6 digits are eclipse ones)
		result = result.replace(/[bB]ug \[?(\d{1,5})\]?/g, "[POLARSYS-$1](https://github.com/search?q=POLARSYS-$1&type=Issues)"); //Add search to Bug #xxx (small number are polarsys issues)
		result = result.replace(/https?:\/\/bugs.eclipse.org\/bugs\/show_bug.cgi\?id=([^\n]+)/g, "[ECLIPSE-$1](https://github.com/search?q=ECLIPSE-$1&type=Issues)");
		result = result.replace(/https?:\/\/polarsys.org\/bugs\/show_bug.cgi\?id=([^\n]+)/g, "[POLARSYS-$1](https://github.com/search?q=POLARSYS-$1&type=Issues)")
		result = result.replace(/https?:\/\/git.polarsys.org\/c\/(kitalpha|capella)\/([^\.]+).git\/commit\/\?id=([^\n]+)/g, "[$3](https://github.com/search?q=$3&type=Commits)");
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
		return extension == "jpg" || extension == "png" || extension == "gif";
	},

	//download an attachment to the attachments/ folder
	downloadAttachment: function(bug, attachment) {
		return new Promise((resolve, reject) => {
			let file = bugzilla.attachmentName(attachment);
			httpq.downloadFile("bugs.eclipse.org", "/bugs/attachment.cgi?id="+attachment.attachid._text, "attachments/"+file).then(e => resolve(e)).catch(e => reject(e));
		});
	},

	//download all attachments for the given bug
	downloadAttachments: function(bug) {
		return new Promise((resolve, reject) => {
			return Promise.all(bug.attachment.map(m => bugzilla.downloadAttachment(bug, m))).then(e => {
				resolve(e.reduce(function (arr, row) {
					return arr.concat(row);
				}, []));
			}).catch(e => {
				reject(e);
			});
		});
	}
}

function getNextBugzillaIdFromIssues(ghIssues) {
	//filter github issues to have only imported ones. (with a ECLIPSE-XXX tag)
	let previousImportedIssues = ghIssues.filter(x => x.body.match(/`ECLIPSE/g));
	let nextBugzillaId = previousImportedIssues.length == 0 ? 553888 : Number(previousImportedIssues[0].body.match(/`ECLIPSE-(\d+)/g)[0].split("-")[1]) + 1; 
	//553888 is the first polarsys issue, before that there is no capella issues by definition
	return nextBugzillaId;
}

//retrieve the next bugzilla to created in the configured repository through github.config.repository
//retrieve the last created github issue and extract `ECLIPSE-xxx` field+1 or 553888
function getNextBugzillaId() {
	return new Promise((resolve, reject) => {
		httpquery.get("api.github.com", `/repos/${github.config.repository}/issues?state=all`).then(ghIssues => {
			resolve(getNextBugzillaIdFromIssues(ghIssues));
		}).catch(error => reject(error));
	});
}

//based on the latest github issues, and the all issues from bugzilla, create the next batch of issues to github
function createNextBatchIssues(nextBugzillaId, bugs) {

	//Retrieve the next bugzilla polarsys id we want to create
	let nextIds = Array(20000).fill(0).map((e,i)=>i+nextBugzillaId);
	
	//Filter to really existing issues
	let existingBugs = bugs.filter(i => i.bug_id != null).map(i => i.bug_id._text.trim());
	nextIds = nextIds.filter(id => existingBugs.includes(""+id));

	//Limit import to the n issues imported as defined in configuration
	nextIds = nextIds.slice(0, bugzilla.config.count);
	console.log(bugzilla.config.count);
	console.log("Next bugzilla to import are :");
	console.log(nextIds);

	return nextIds.map(x => createIssue(""+x, bugs));
}

function smallWait(issue) {
	return new Promise((resolve, reject) => {
		let waitTimer = Math.round(Math.random()*300);
		setTimeout(function () {
			resolve(issue);
		}, waitTimer);
	});
}

function wait(issue) {
	return new Promise((resolve, reject) => {
		let waitTimer = Math.round(Math.random()*1000)+940;
		setTimeout(function () {
			resolve(issue);
		}, waitTimer);
	});
}

function publishAll(issues, milestones) {
	return github.createMilestones(milestones).then(miles => {
		return consecutive(issues, issue => affectMilestone(issue, miles).then(i => publish(i, miles)));
	});
}

function outputAll(issues, milestones) {
	//console.log(JSON.stringify(issues, null, " "));
	return github.createMilestones(milestones).then(miles => {
		return consecutive(issues, issue => affectMilestone(issue, miles).then(i => output(i, miles)));
	});
}

function output(issue) {
	//console.log(JSON.stringify(issue, null, " "));

	console.log(JSON.stringify(
		{ 	id:issue.bugzillaId, 
			milestoneId: issue.milestoneId, 
			body: issue.body, 
			comments: issue.comments 
		}, null, " "));

	return Promise.resolve(issue); 
}

function publish(issue, miles) {
	Promise.resolve(issue).then(i => {
		console.log(`${i.bugzillaId}: createGithubIssue`);
		return github.createGithubIssue(i);

	}).then(wait).then(i => {
		console.log(`${i.bugzillaId}: addGithubLabels`);
		return github.addGithubLabels(i);

	}).then(wait).then(i => {
		console.log(`${i.bugzillaId}: addGithubMilestone`);
		return github.addGithubMilestone(miles, i);

	}).then(wait).then(i => {
		console.log(`${i.bugzillaId}: postGithubComments`);
		return github.postGithubComments(i);

	}).then(wait).then(i => {
		console.log(`${i.bugzillaId}: closeIssue`);
		return github.closeIssue(i);

	}).then(smallWait).then(i => {
		console.log("\nIf you want to quit, its now! (Ctrl+C)\n\n");
		return Promise.resolve(i);

	}).then(wait).then(wait);
}

function affectMilestone(issue, miles) {
	if (issue.milestoneName != null) {
		let milestone = miles.find(x => x.title == issue.milestoneName);
		if (milestone != null && milestone != undefined) {
			issue.milestoneId = milestone.number;
		}
	}
	return Promise.resolve(issue);
}

//create the given issue based on its bugzillaId
function createIssue(bugzillaId, bugs) {
	let bug = bugs.find(i => i.bug_id != null && ""+i.bug_id._text.trim() == (""+bugzillaId).trim());
	if (bug == undefined) { //if bug doesnt exist in imported bugs, then create nothing, we will skip it
		return null;
	}

	let issue = {
		"bugzillaId": bugzillaId,
		"title": bug.short_desc._text,
		"labels": [],
		"comments": {},
		"reporter": bugzilla.getReporter(bug)
	};
	
	let version = bugzilla.getTargetVersion(bug);
	if (version != null) {
		issue.milestoneName = version;
	}

	version = bugzilla.getDetectedVersion(bug);
	if (version != null) {
		issue.version = version;
	}

	issue.body = bugzilla.getFullText(bug, true, issue);
	issue.comments.body = bugzilla.getFullText(bug, false, issue);
	issue.status = bugzilla.getStatus(bug);
	issue.product = bugzilla.labelProduct(bug);
	issue.severity = bug.bug_severity._text;
	issue.component = bugzilla.labelComponent(bug);

	// add severity
	issue.labels.push(issue.severity);

	// some components doesn't require a label as these issues will be stored on the dedicated repository
	let componentsWithoutLabel = [
		"Capella Studio", "Filtering", "Cybersecurity", "GenDoc HTML", "Groovy", 
		"Modes/States VP", "RequirementsVP", "System2Subsystem", "Textual editor",
		"XML Pivot"
	];
	if (!componentsWithoutLabel.includes(issue.component)) {
		issue.labels.push(issue.component.replace(/[\/ ]/g, "-").toLowerCase());
	}

	// some status doesn't require a label as we didn't used them. a closed issue with target milestone is enough
	let statusWithoutLabel = [
		"resolved", "verified", "new", "assigned", "closed", "fixed", "moved"
	];
	if (!statusWithoutLabel.includes(issue.status)) {
		issue.labels.push(issue.status);
	}

	// close issues with these statuses
	let closableStatus = [
		"verified", "invalid", "worksforme", "fixed", "closed", "wontfix", "resolved", "duplicate", "moved", "not_eclipse"
	];
	issue.closeable = closableStatus.includes(issue.status);

	return issue;
}


//--------------------------------------------------
//--------------------------------------------------
//--------------------------------------------------

//Load configuration and proceed
fsquery.read("config.json").then(e => proceed(JSON.parse(e))).catch(e => { console.log(e); });

function proceedDownloadAttachments(config) {

	fsquery.read(config.bugsFile).then(ee => {
		
		const obj = JSON.parse(ee);
		let issues = obj.bugzilla.bug;

		let includedProducts = [ "Capella", "Kitalpha" ];
		issues = issues.filter(x => includedProducts.includes(x.product._text));
		
		issues.filter(i => i.attachment != undefined && !Array.isArray(i.attachment)).forEach(i => i.attachment = [i.attachment]); //.filter(i => i.long_desc.length > 7);
		issues.filter(i => i.attachment != undefined).forEach(i => bugzilla.downloadAttachments(i));
	});
}

function proceedCreateIssues(config) {

	//Load issues
	fsquery.read(config.bugsFile).then(json => {
		
		let includedProducts = config.includedProducts; // ["Capella", "Kitalpha"]
		
		let includedComponents = config.includedComponents; 
		//[ 
		//	"Capella Gitadapter", "Capella Studio", "Core", "Detachment", "Diagram", "Diff-Merge",
		//	"Documentation", "Filtering", "Forum", "GenDoc HTML", "General", "Groovy", "Library",
		//	"Mass VP", "ModelValidation", "Modes/States VP", "Patterns", "Perfo VP", "Price VP", "Properties",
		//	"Rec-Rpl", "Releng", "RequirementsVP", "System2Subsystem", "Test framework", "Textual editor",
		//	"Transition", "UI", "Website", "XML Pivot", "AF and VP", "Build", "CTK", "CTK/Doc" 
		//];

		let bugs = JSON.parse(json).bugzilla.bug;
		
		// Filter by product
		bugs = bugs.filter(i => includedProducts.includes(i.product._text));
		
		let allComponents =  Array.from(new Set(bugs.map(i => i.component._text).sort()));
		console.log("All components");
		console.log(allComponents);
		
		// Filter by components
		bugs = bugs.filter(i => includedComponents.includes(i.component._text));
		console.log(bugs.length);
		
		let products = Array.from(new Set(bugs.map(i => i.product._text).sort()));
		console.log("Keeped products");
		console.log(products);

		let components =  Array.from(new Set(bugs.map(i => i.component._text).sort()));
		console.log("Keeped components");
		console.log(components);
		
		// Compute all versions used in those issues
		let milestones = Array.from(new Set(bugs.map(i => bugzilla.getUsedVersions(i)).reduce(concat, []))).sort();
		console.log(milestones);

		//Update bugs object to ease manipulation afterwards.

			//create a default array of [description] if empty or if only one description
			bugs.filter(i => i.long_desc == undefined).forEach(i => i.long_desc = 
			[{
				"who": {
					"_attributes": { "name": i.reporter._attributes.name },
					"_text": i.reporter._text
				},
				"bug_when": { "_text": i.creation_ts._text  },
				"thetext": {  "_text": ""  }
			}]);
			bugs.filter(i => !Array.isArray(i.long_desc)).forEach(i => i.long_desc = [i.long_desc]); //.filter(i => i.long_desc.length > 7);
			
			//replace bugs.attachment fields to an array even it there is only one attachment. (to ease text replacement process)
			bugs.filter(i => i.attachment != undefined && !Array.isArray(i.attachment)).forEach(i => i.attachment = [i.attachment]);
		
		// find the next bugzilla to import then create and import next batch of issues.
		getNextBugzillaId().then(nextId => {
			let toCreate = createNextBatchIssues(nextId, bugs).filter(x => x != null);
			return publishAll(toCreate, milestones);

		}).then(e => {
			console.log("All issues are transferred");
	
		}).catch(error => {
			console.log(error);
		});

	}).catch(error => {
		console.log(error);
	});

}

function proceed(config) {
	httpquery.user = config.user;
	httpquery.password = config.password;

	httpqueryc.user = config.userCommiter;
	httpqueryc.password = config.passwordCommiter;

	github.config = config;
	bugzilla.config = config;	
	
	//export as json a xml
	//bugzilla.parse2json("show_bug.cgi-281120.xml", "show_bug.cgi-281120.json");
	//if (true) return;

	//Load attachments for a given repository
	//proceedDownloadAttachments(config);
	//if (true) return;

	proceedCreateIssues(config);
};

