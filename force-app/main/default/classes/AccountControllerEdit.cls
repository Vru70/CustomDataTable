/**
 * @File Name          : accountDataTable.js
 * @Description        :
 * @Author             :
 * @Group              :
 * @Last Modified By   : Vrushabh Uprikar
 * @Last Modified On   : 27-07-2021
 * @Modification Log   :
 * Ver       Date            Author      		    Modification
 * 1.0    (DD-MM-YYYY)                               Initial Version
 **/
public with sharing class AccountControllerEdit
{
    @AuraEnabled( cacheable = true )
    public static List<Account> fetchAccounts() {
        return [ SELECT Id, Name, Phone,Fax, CreatedDate,Industry,AccountSource
                            FROM Account
                            ORDER BY CreatedDate DESC LIMIT 10];
    }

    @AuraEnabled
    public static string updateAccounts( Object data,Object data2 ) {
        List < Account > accsForUpdate = (List <Account>) JSON.deserialize(JSON.serialize(data),
            List <Account>.class
        );
        List < Account > accsForUpdate2 = (List <Account>) JSON.deserialize(JSON.serialize(data2),
            List <Account>.class
        );
        List<Account> acclist=new List<Account>();
        for ( Integer i=0;i<accsForUpdate.size();i++){
            if(String.valueof(accsForUpdate[i].id).length()<6){
                Account acco = new Account();
                acco.Name=accsForUpdate[i].name !=null || accsForUpdate[i].name!='' ? accsForUpdate[i].name:'Test';
                acco.Phone = accsForUpdate[i].Phone;
                acco.Fax = accsForUpdate[i].Fax;
                acco.Industry = accsForUpdate2[i+1].Industry;
                acco.AccountSource  = accsForUpdate[i].AccountSource;
                acclist.add(acco);
            }
            else{
                accsForUpdate[i].industry=!(accsForUpdate2.size()>=i+1)?accsForUpdate[i].industry:accsForUpdate2[i+1].industry;
                acclist.add(accsForUpdate[i]);
            }

        }

        try {
            upsert acclist;
            return 'Success: Account(s) updated successfully';
        }
        catch (Exception e) {
            return 'The following exception has occurred: ' + e.getMessage();
        }

    }

    @AuraEnabled( cacheable = true )
    public static List<PickListWrap> getPicklistOptions(String objectApiName, String fieldApiName) {
        List<String> picklistOptions = new List<String>();
        List<PickListWrap> PickListWrapList = new List<PickListWrap>();

        try {
            Schema.SObjectType obj_describe = Schema.getGlobalDescribe().get(objectApiName) ;
            Schema.DescribeSObjectResult obj_describe_result = obj_describe.getDescribe() ;
            Map<String,Schema.SObjectField> fields = obj_describe_result.fields.getMap() ;
            Schema.DescribeFieldResult fieldResult = fields.get(fieldApiName).getDescribe();
            List<Schema.PicklistEntry> ple = fieldResult.getPicklistValues();
            for (Schema.PicklistEntry pickListVal : ple) {
                String option = pickListVal.getValue();

                PickListWrapList.add(new PickListWrap(pickListVal.getLabel(),pickListVal.getValue()));
                picklistOptions.add(option);
                system.debug('Picklistvalue '+picklistOptions);
            }
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
        return PickListWrapList;
    }
    public class PickListWrap{
        @AuraEnabled public String label;
        @AuraEnabled public String value;

        public PickListWrap(String label, String value){
        	this.value = value;
            this.label = label;
        }
    }
}
