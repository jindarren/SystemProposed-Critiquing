// The script is used to find a top recommended items for a specific user based on MAUT.
// input: user, itemData, numericalAttributes, nominalAttributes
// output： topRecItemID, utilityDict (store the preference utilities of user to each item)

const _ = require('lodash');
// ------------------------------------------------------------------
// Value function
// ------------------------------------------------------------------
function nearIsBetter_ValueFunction(user, item, itemData, attribute)
{
	sortItemData = _.orderBy(itemData, [attribute], ['desc']); // time-comsuming
	let maxAttrV = sortItemData[0][attribute];
	let minAttrV = itemData[itemData.length-1][attribute];

	let userAttrV = user.preferenceData[attribute];
	let itemAttrV = itemData[item][attribute];
	return (1-Math.abs(itemAttrV - userAttrV )/(maxAttrV - minAttrV));
}

function nominalAttribute_ValueFunction(user, item , itemData, attribute)
{
	if (user.preferenceData[attribute].includes(itemData[item][attribute]))
	{
		return 1;
	}
	else{
		
		return 0;
	}
}

// ------------------------------------------------------------------
// Multi-attribute Utility Theory (MAUT)
// ------------------------------------------------------------------
function MAUT(user, itemData, numericalAttributes, nominalAttributes)
{

	console.log("-----------         MAUT          --------------");

	var utility = [];
	let preferenceValue = [];
	let attribute = '';
	let value = 0;

	for (let i = 0; i < itemData.length; i++){
		
		preferenceValue = {};
		let itemID = itemData[i]['id'];
		// Step 1: Obtain the value for each attributes
		// [1] Nominal Attributes
		
		for (let attribute of nominalAttributes)
		{	
			value = nominalAttribute_ValueFunction(user,i, itemData, attribute);		
			preferenceValue[attribute] = value ;
		}
		// [2] Numerical Attributes
		for (let attribute of numericalAttributes)
		{
			value = nearIsBetter_ValueFunction(user,i, itemData, attribute);		
			preferenceValue[attribute] = value ;
		}
		//console.log(preferenceValue);
		
		// Step 2: calculate the utility
		let itemUtility = 0;
		for (let attribute of nominalAttributes)
		{
			itemUtility += preferenceValue[attribute] * user.attributeWeight[attribute];
		}
		for (let attribute of numericalAttributes)
		{
			itemUtility += preferenceValue[attribute] * user.attributeWeight[attribute];
		}

		utility[i]= {'itemID':itemID, 'utility':itemUtility};
		
	}
	return utility;
	
}


module.exports = (user, itemData, numericalAttributes, nominalAttributes) => {

    let utilityDict = MAUT(user, itemData, numericalAttributes, nominalAttributes);
	let sortUtilityDict = _.orderBy(utilityDict, ['utility'], ['desc']);  // time-comsuming
	let topRecItemID = sortUtilityDict[0]['itemID'];
	console.log('Top Recommended Item ID : '+ topRecItemID );
	console.log('Top Recommended Item Utility : '+ sortUtilityDict[0]['utility'] );

    return ({'topRecItemID':topRecItemID,'utilityDict':utilityDict});

}