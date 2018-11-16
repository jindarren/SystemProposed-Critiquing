const fs = require('fs');
const csv = require('csv-parser');
const getTopRec = require('./getTopRec.js');
const sysCritique = require('./systemCritiquing.js');
const _ = require('lodash');

// User Class
class User
{
	constructor(id, preferenceData, attributeWeight){
		this.id = id;
		this.preferenceData = preferenceData;
		this.attributeWeight = attributeWeight;
	}

};

//Item （Read item from database or files)
//1. popularity
//2. artist 
//3. danceability	
//4. energy	
//5. speechiness	
//6. acousticness	
//7. instrumentalness	
//8. liveness	
//9. valence	
//10. genre


// Item attributes 
let numericalAttributes = ['popularity', 'danceability', 'energy', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence'];
let nominalAttributes = ['artist','genre'];
let attributes = numericalAttributes.concat(nominalAttributes);


// Initilaization 
// User Data
// Get user id and corresponding data, including preference data and attribute weight for each attribute of item
// if user is new user, we set default preference / weight for he/her.

let userID = '5';
let defaultWeight = 1/(numericalAttributes.length+nominalAttributes.length);

// may be revised if needed
let preferenceData = {'artist':['Kevin Hart','Halsey'],'genre':['comedy','brostep'], 'popularity': 50, 'danceability': 0.5, 'energy':0.5, 'speechiness':0.5, 'acousticness':0.5, 'instrumentalness':0.5, 'liveness':0.5, 'valence':0.5};
let attributeWeight = {'artist':defaultWeight,'genre':defaultWeight, 'popularity':defaultWeight, 
'danceability': defaultWeight, 'energy':defaultWeight, 'speechiness':defaultWeight, 'acousticness':defaultWeight, 
'instrumentalness':defaultWeight, 'liveness':defaultWeight, 'valence':defaultWeight};

let user = new User(userID, preferenceData, attributeWeight);

//Item Data
let inputFilePath = "spotify_tracks_new.csv";
let itemData = [];

// 

// -----------------------------------------------------------------------------------------

fs.createReadStream(inputFilePath)
	.pipe(csv())
	.on('data', function(data) {
		// load item data
		itemData.push(data);
	})
	.on('end', () => {
		
		console.log("------------------------------------------------");
		console.log("Total Item Data: "+itemData.length + " records");
		console.log("Read Music Data Finished!");
		console.log("------------------------------------------------");
		
		// Step 1: Find a top recommended item based on MAUT algorithm
		
		console.log("------------------------------------------------");
		console.log("---------   Step 1:   Find a topRec  -----------");
		console.log("------------------------------------------------");

		let start = new Date().getTime();
	    let topRec = getTopRec(user, itemData, numericalAttributes, nominalAttributes);
        let topRecItemID = topRec.topRecItemID;
        let utilityDict = topRec.utilityDict;
		let end = new Date().getTime();
		console.log("------------------------------------------------");
		console.log('-----Execution time: ' + (end-start) + 'ms.');
		console.log("------------------------------------------------"); 
		// Step 2: Produce critiques using Apriori algorithm and select the most favorite critique with higher tradeoff utility
		
		start = new Date().getTime();
        let numberOfItemsRec = 2;    // the number of items that satisfy favorite critique and that will be presented
        let systemCritiquing = sysCritique(user, itemData, topRecItemID, utilityDict, nominalAttributes, numericalAttributes, numberOfItemsRec);
        
		end = new Date().getTime();
		console.log("------------------------------------------------");
		console.log('-----Execution time: ' + (end-start) + 'ms.');
		console.log("------------------------------------------------"); 

		console.log(systemCritiquing.favorCritique);
        console.log(systemCritiquing.topN);

		// When system get the response from user, we need to revise users' preference and adjust attribute weight respectively.
	});  


