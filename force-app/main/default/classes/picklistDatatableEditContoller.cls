/**
 * @author            : Vrushabh Uprikar
 * @last modified on  : 03-08-2021
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
            List<List<PickListWrap>> piclist = new List<List<PickListWrap>>(); // Picklist values with fieldApi Name
            for(Schema.FieldSetMember f : lstFSMember) //Use of Schema.FieldSetMember to get the fields from Field Set.
            {
                query += f.getFieldPath() + ', '; // getFieldPath() of FieldSetMember gives the fieldAPI which has been used to build SOQL query.
 				if(f.getType() == Schema.DisplayType.Picklist)
                {
                    String fpath = (String)f.getFieldPath();
                    piclist.add(getPicklistOptions(strObjectApiName,fpath));
                    system.debug(piclist);
                }
            }
            query += 'Id FROM ' + strObjectApiName ;
            query += ' LIMIT 10 ';
	        //execute query
            List<SObject> lstRecords = Database.query(query);
            //prepare a map which will hold fieldList and recordList and return it
            returnMap.put('FIELD_LIST', JSON.serialize(lstFSMember));
            returnMap.put('RECORD_LIST', JSON.serialize(lstRecords));
            returnMap.put('PICKVAL_LIST', JSON.serialize(piclist));

            return JSON.serialize(returnMap);
        }
        return null; // will return null if ObjectApi and FieldSet not found
    }


    @AuraEnabled
    public static String upsertSOBJRecord(String fieldData, String SFDCobjectApiName)
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
            for (Schema.PicklistEntry pickListVal : ple)
            {
                String option = pickListVal.getValue();
                PickListWrapList.add(new PickListWrap(pickListVal.getLabel(),pickListVal.getValue(), fieldApiName));
                picklistOptions.add(option);
            }
        } catch (Exception ex)
        {
            throw new AuraHandledException(ex.getMessage());
        }
        return PickListWrapList;
    }

    public class PickListWrap
    {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        @AuraEnabled public String fieldApi;
        public PickListWrap(String label, String value, String fieldApi)
        {
        	this.value = value;
            this.label = label;
            this.fieldApi = fieldApi;

        }
    }
}
