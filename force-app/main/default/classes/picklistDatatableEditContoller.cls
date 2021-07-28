/**
 * @author            : Vrushabh Uprikar
 * @last modified on  : 28-07-2021
 * @last modified by  : Vrushabh Uprikar
**/
public with sharing class picklistDatatableEditContoller
{
    @AuraEnabled(cacheable=false)
    public static String getFieldSetAndRecords(String strObjectApiName, String strfieldSetName)
    {
        Map<String, String> returnMap = new Map<String,String>();
        if(!String.isEmpty(strObjectApiName) && !String.isEmpty(strfieldSetName))
        {
            //get fields from FieldSet
            SObject sObj = (SObject)(Type.forName('Schema.'+ strObjectApiName).newInstance()); //  Create new sObj
            List<Schema.FieldSetMember> lstFSMember =
                sObj.getSObjectType().getDescribe().fieldSets.getMap().get(strfieldSetName).getFields(); // Collecting all fields from fildSet
            //prepare SOQL query based on fieldAPIs
            String query = 'SELECT ';
            for(Schema.FieldSetMember f : lstFSMember) //Use of Schema.FieldSetMember to get the fields from Field Set.
            {
                query += f.getFieldPath() + ', '; // getFieldPath() of FieldSetMember gives the fieldAPI which has been used to build SOQL query.
            }
            query += 'Id FROM ' + strObjectApiName ;
            query += ' LIMIT 20 ';
	        //execute query
            List<SObject> lstRecords = Database.query(query);
            //prepare a map which will hold fieldList and recordList and return it
            returnMap.put('FIELD_LIST', JSON.serialize(lstFSMember));
            returnMap.put('RECORD_LIST', JSON.serialize(lstRecords));
            return JSON.serialize(returnMap);
        }
        return null; // will return null if ObjectApi and FieldSet not found
    }


    @AuraEnabled
    public static String setSObjectRecords(String fieldData, String SFDCobjectApiName)
    {
        Type objtype = Type.forName(SFDCobjectApiName);                               // Eg., conatct
        if(!String.isEmpty(fieldData) && !String.isEmpty(SFDCobjectApiName))
        {
            SObject sObj = (SObject)JSON.deserialize(fieldData, objtype);
            System.debug('fieldData : '+fieldData);                                    // '{\"id\":\"0032w00000X6KgxAAF\",\"FirstName\":\"SonuTest1\"}'
            try
            {
                upsert sObj;
                System.debug(' ::Success:: ');
                return 'Success';
            } catch(Exception e)
            {
                System.debug('Error in Update : '+e.getMessage());
                return ''+e.getMessage();
            }
        }
        return 'Something Went Wrong';
    }

    @AuraEnabled( cacheable = true )
    public static List<PickListWrap> getPicklistOptions(String objectApiName, String fieldApiName)
    { // Eg. Account, Type(FieldApiName)
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
        } catch (Exception ex)
        {
            throw new AuraHandledException(ex.getMessage());
        }
        System.debug('Picklist'+ PickListWrapList); // (Prospect, Customer - Direct, Customer - Channel, Channel Partner / Reseller, Installation Partner, Technology Partner)
        return PickListWrapList;
    }

    public class PickListWrap
    {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        public PickListWrap(String label, String value)
        {
        	this.value = value;
            this.label = label;
        }
    }
}
