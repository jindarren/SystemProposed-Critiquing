// The script is used to generate appropriate critique using Apriori algorithm. 
// Furthermore, it can be used to select the most favorite critique and return the corresponding recommender items
// input: user, itemData, topRecItemID, utilityDict, nominalAttributes, numericalAttributes, numberOfItemsRec
// output： favorCritique, topN (topN recommended items)

const fi = require('frequent-itemset');
const _ = require('lodash');

	
// ------------------------------------------------------------------
// Tradeoff Utility 
// ------------------------------------------------------------------
function computeTradeoffUtility (user, itemData, critique, critique2ItemSet,numericalAttributes, nominalAttributes){
	
	//console.log("compute tradeoff utility for critiques");
	let tradeoffUtility = 0;
	let critiqueDict = [];
	
	let tradeoff_improve = 0.75;
	let tradeoff_compromise = 0.25;
	let tradeoff = 0.5;
	for (let c of critique)
	{
		let critique = c.split("-");
		// how to judge whether it is improved or compromised?? 

		if(critique[1]=="higher")
		{
			tradeoff = tradeoff_improve;
		}
		if(critique[1] == "lower")
		{
			tradeoff = tradeoff_compromise;
		}
		
		critiqueDict.push({'attribute':critique[0], 'tradeoff':tradeoff});
	}
	let firstTerm = 0;
	for (let a=0; a<critiqueDict.length; a++)
	{
		let attribute = critiqueDict[a]['attribute'];
		firstTerm += user.attributeWeight[attribute] * critiqueDict[a]['tradeoff'];
	}
	let secondTerm = 0;
	for (let i = 0; i < critique2ItemSet.length; i++)
	{
		secondTerm += critique2ItemSet[i]['utility'];
	}
	secondTerm = secondTerm/critique2ItemSet.length;

	tradeoffUtility = firstTerm * secondTerm;
	return tradeoffUtility;
}




// -----------------------------------------------------------------------------------------
// Module Exports
// -----------------------------------------------------------------------------------------

module.exports = (user, itemData, topRecItemID, utilityDict, nominalAttributes, numericalAttributes, numberOfItemsRec) =>{

	// find the index of the top recommended items
	let indexOfTopRecItem = _.findIndex(itemData, {'id': topRecItemID});
		
	// print the attribute value of top recommended items
	console.log('Index of Top Recommended Item : '+ indexOfTopRecItem);
	for (let a in itemData[indexOfTopRecItem])
	{
		console.log(a+":"+itemData[indexOfTopRecItem][a]);
	}
	// Apriori Algorithms
	// construct item attribute pairs set (improved or compromised)
	let itemCritiqueArray = [];  //  store all attribute critique for each item in the form of array and used in Apriori Algorithms
	let itemCritiqueDict = [];  //  store all attribute critique for each item in the form of dictionary and used when selecting the favor critiques

	// obtain critique for each item by comparing with the top recommended items
	for (let i=0; i < itemData.length; i++){
		let item = itemData[i];
		let attribute = ''; 
		let itemAttrV = '';
		let topRecItemAttrV = '';
		let critiqueArray = [];  

		//  obtain critiques for nominal attributes
		for (let attribute of nominalAttributes)
		{
			itemAttrV = item[attribute];
			critiqueArray.push([attribute,itemAttrV].join('-'));
		}

		//  obtain critiques for numerical attributes
		for (let attribute of numericalAttributes)
		{
			itemAttrV = item[attribute];
			topRecItemAttrV = itemData[indexOfTopRecItem][attribute];
			if(itemAttrV==topRecItemAttrV)
			{
				critiqueArray.push([attribute,'equal'].join('-'));
			}
			if(itemAttrV < topRecItemAttrV)
			{
				critiqueArray.push([attribute,'lower'].join('-'));
			}
			if(itemAttrV > topRecItemAttrV)
			{
				critiqueArray.push([attribute,'higher'].join('-'));
			}
		}

		itemCritiqueArray.push(critiqueArray);
		itemCritiqueDict[i]={'itemID':item['id'], 'critiques':critiqueArray};
	}

	console.log("------------------------------------------------");
	console.log("-------   Step A:   Find Frequent Set  ---------");
	console.log("------------------------------------------------"); 

	
	// find frequent set -- the package should be checked  !!!!
	let supportValue = 0.2;
	let frequentCritiqueSet = fi(itemCritiqueArray,  supportValue,  true);
	console.log(frequentCritiqueSet);

	console.log("------------------------------------------------");
	console.log("-----   Step B:   Select Favor Critique  -------");
	console.log("------------------------------------------------"); 

	// select the favor critique by computing the tradeoff utility
	let favorCritique = [];
	let critiqueUtilityDict = [];
	let allCritique2ItemDict = [];
	for (let critique of frequentCritiqueSet)
	{
		//console.log(critique);
		// Obtain the set of products satisfy critique
		let critique2ItemSet = [];  // store the set of items that satisfy the specific critique
		let itemCritiques = [];
		for (let i = 0; i < itemCritiqueDict.length; i++)
		{	
			itemCritiques = itemCritiqueDict[i]['critiques'];
			let flag = 1;
			for (let c of critique)
			{
				if (!itemCritiques.includes(c))
				{
					flag = 0;	
				}
			}
			if (flag == 1)
			{
				critique2ItemSet.push({'id': itemCritiqueDict[i]['itemID'], 'utility': utilityDict[i]['utility']});
			}
		}
		//console.log(critique2ItemSet.length);
		
		// How to set tradeoff for each attributes !!
		tradeoffUtility = computeTradeoffUtility(user, itemData, critique, critique2ItemSet,numericalAttributes, nominalAttributes);
		critiqueUtilityDict.push({'critique':critique, 'tradeoffUtility':tradeoffUtility});
		
		allCritique2ItemDict.push({'critique':critique, 'itemSet':critique2ItemSet}); // used to get recommender item when proposing critiques
	}
	// sort the tradeoffUtility for critiques
	let sortCritiqueUtility = _.orderBy(critiqueUtilityDict, ['tradeoffUtility'], ['desc']);
	//console.log(sortCritiqueUtility);
	favorCritique = sortCritiqueUtility[0]['critique'];
	console.log("Favor Critique: "+ favorCritique);

	let favorCritique2ItemSet = _.find(allCritique2ItemDict, {'critique': favorCritique});
	// console.log(favorCritique2ItemSet);
	let sortItemSet = _.orderBy(favorCritique2ItemSet['itemSet'], ['utility'],['desc']);
	// console.log(sortItemSet);

	let topN = [];
	for (let i=0; i< numberOfItemsRec; i++)
	{
		topN.push(sortItemSet[i]['id']);
	}

	return {'favorCritique': favorCritique, 'topN': topN }
}




