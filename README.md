# Bugzilla import to Github #

## Prerequisites ##

Clone repository and create a config.json into it inspired from config.json.schema

## Extract Bugzilla issues ##


### Create a xml file of issues ###

Retrieve Capella bugzilla issues, and extract it as XML 

https://bugs.eclipse.org/bugs/buglist.cgi?classification=Polarsys&limit=0&list_id=20174132&order=bug_status%2Cpriority%2Cassigned_to%2Cbug_id&product=Capella&product=General&product=Kitalpha&query_format=advanced

Save it as `show_bug.cgi.xml`

### Create a json file from xml ###

`bugzilla.parse2json("show_bug.cgi.xml", "bugs.json")`

## Then import ##
