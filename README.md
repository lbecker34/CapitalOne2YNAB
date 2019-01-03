# CapitalOne2YNAB
Google App Script that scrapes capital one transaction email messages and imports the transactions into YNAB.

This script reads through emails Labeled "CapitalOne". In order for this script to work,
you must set three script properties by going to File/Project Properties/Script Properties
in the App Script editor. 

The 3 properties are:
YNAB-ACCOUNT-ID
YNAB-ACCESS-TOKEN
YNAB-BUDGET-ID

After the properties are set, set a trigger for this function to run every minute. You can adjust the
trigger as you please, but I wanted mine to be as real time as possible. If you make it run less often,
you will need to modify the GmailApp.search criteria found towards to the top of the main function. It 
needs to be a little longer than your trigger to account for any delays.
