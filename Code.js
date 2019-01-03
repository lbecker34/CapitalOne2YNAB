/***************************************************************
This script reads through emails Labeled "CapitalOne". In order for this script to work,
you must set three script properties by going to File/Project Properties/Script Properties
in the script editor. 

The 3 properties are:
YNAB-ACCOUNT-ID
YNAB-ACCESS-TOKEN
YNAB-BUDGET-ID

After the properties are set, set a trigger for this function to run every minute. You can adjust the
trigger as you please, but I wanted mine to be as real time as possible. If you make it run less often,
you will need to modify the GmailApp.search criteria found towards to the top of the main function. It 
needs to be a little longer than your trigger to account for any delays.

****************************************************************/

var scriptProperties = PropertiesService.getScriptProperties();

function main() {
	var transactions = [];
	// Set a variable to our "CapitalOne" label in Gmail
	var threads = GmailApp.search("label:CapitalOne is:unread");
	for (var i in threads) {
		var messages = threads[i].getMessages();
		for (var j in messages) {
			if (messages[j].isUnread()) {

				var emailBody = messages[j].getPlainBody(); // Get email body in plaintext, no HTML
				console.info("Email body: " + emailBody);

				var transaction_date = "",
					transaction_vendor = "",
					transaction_amount = "";

				// Get date of transaction
				var regExpDate = /we're notifying you that on (...+), at/; // regex to find date
				var message_date = regExpDate.exec(emailBody);
				if (message_date) {
					var newDate = Date.parse(message_date[1]);
					transaction_date = formatDate(newDate);
					console.info("Email message date: " + transaction_date);
				}

				// Get vendor name
				var regExpVendor = /, at (...+),/; // regex to find transaction vendor name
				var message_vendor = regExpVendor.exec(emailBody);
				if (message_vendor) {
					transaction_vendor = message_vendor[1];
					console.info("Email message vendor: " + transaction_vendor);
				}

				// Get transaction amount
				var regExpAmount = /purchase in the amount of \$(\S+) was/; // regex to find transaction amount
				var message_amount = regExpAmount.exec(emailBody);
				if (message_amount) {
					transaction_amount = ConvertToMiliUnits(message_amount[1]);
				}

				var transaction = {
					account_id: scriptProperties.getProperty('YNAB-ACCOUNT-ID'),
					date: transaction_date,
					amount: transaction_amount,
					payee_name: transaction_vendor,
					import_id: (Date.now()).toString(),
					memo: "Script Imported",
				};
				transactions.push(transaction);
				messages[j].markRead(); //mark emails as read so they don't get picked up next run.
			}
		}
	}
	if (transactions.length > 0) {
		SendToYNAB(transactions);
	}
}

function SendToYNAB(transactions) {
	var url = 'https://api.youneedabudget.com/v1/budgets/' + scriptProperties.getProperty('YNAB-BUDGET-ID') + '/transactions/';
	var payload = "{ \"transactions\": " + JSON.stringify(transactions) + "}";
	var options = {
		"method": "POST",
		"payload": payload,
		"followRedirects": true,
		"headers": {
			"Authorization": "Bearer " + scriptProperties.getProperty('YNAB-ACCESS-TOKEN'),
			"Content-Type": "application/json; charset=utf-8"
		}
	};

	var result = UrlFetchApp.fetch(url, options);
}

function ConvertToMiliUnits(value) {
	var decimalLocation = value.indexOf(".");
	var message_amount = value;
	if (decimalLocation > -1) {
		message_amount = [value.slice(0, decimalLocation + 3), "0", value.slice(decimalLocation + 3)].join('');
		message_amount = message_amount.replace(".", "");
		message_amount = "-" + message_amount;
	}
	console.info("Email message amount: " + message_amount);
	return message_amount;
}

function formatDate(date) {
	var d = new Date(date),
		month = '' + (d.getMonth() + 1),
		day = '' + d.getDate(),
		year = d.getFullYear();

	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;

	return [year, month, day].join('-');
}
