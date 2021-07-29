/**
 * @File Name          : accountDataTable.js
 * @Description        :
 * @Author             :
 * @Group              :
 * @Last Modified By   : Vrushabh Uprikar
 * @Last Modified On   : 29-07-2021
 * @Modification Log   :
 * Ver       Date            Author      		    Modification
 * 1.0    (DD-MM-YYYY)                               Initial Version
 **/
import { LightningElement, wire, track, api } from 'lwc';

import { reduceErrors } from 'c/ldsUtils';
import getFieldSetAndRecords from '@salesforce/apex/picklistDatatableEditContoller.getFieldSetAndRecords';
import setSObjectRecords from '@salesforce/apex/picklistDatatableEditContoller.setSObjectRecords';

import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import updateAccounts from '@salesforce/apex/AccountControllerEdit.updateAccounts';
import getPicklistOptions from '@salesforce/apex/AccountControllerEdit.getPicklistOptions';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';

//  const column=[
//      { "label" : "Name", "apiName" : "Name" ,"fieldType":"text","objectName":"Account", "fieldName": "Name", editable: true },
//      { "label" : "Phone", "apiName" : "Phone" ,"fieldType":"text","type":"phone","objectName":"Account","fieldName": "Phone", editable: true },
//      { "label" : "Total Spending", "apiName" : "Total_Spending__c" ,"fieldType":"text","objectName":"Account","fieldName": "Total_Spending__c", editable: true },
//  ];

export default class AccountDatatable extends LightningElement {

    @track allData = []; // Datatable
    allDataOrgCopy = []; // DatatableOrignalCpy
    @track columns ;

    @track fieldOption = '';
    @track fieldOptionJSON = []; // list of fields option for combobox
    @track FieldsValue; // default value of combobox
    @track fieldType; // data type

    @api SFDCobjectApiName;
    @api fieldSetName;

    fieldName;

    /*records=[];
    wiredRecords;
    error;

    keyIndex = 0;
    draftValues = [];
    picklistval;
    updatedFields=[]

    //Json to insert new row in Datatable
    acc = {
        Id: 0,
        Name: "",
        Phone:"",
        Fax: "",
        Industry: "",
    }*/


    connectedCallback() {
        getFieldSetAndRecords({
            strObjectApiName: this.SFDCobjectApiName,
            strfieldSetName: this.fieldSetName
        })
            .then(data => {

                let objStr = JSON.parse(data);

                let listOfFields = JSON.parse(Object.values(objStr)[1]);

                //retrieve listOfRecords from the map
                let listOfRecords = JSON.parse(Object.values(objStr)[0]);

                let items = []; //local array to prepare columns
                listOfFields.map(element => {
                    items = [...items, {
                        label: element.label,
                        apiName: element.fieldPath,
                        type: element.type,
                        fieldType: 'text',
                        objectName: this.SFDCobjectApiName,
                        fieldName: element.fieldPath,
                        editable: true,
                    }];
                });

                var xx = JSON.stringify(listOfRecords);
                this.allData = JSON.parse(xx);
                this.allDataOrgCopy = JSON.parse(xx);
                this.columns = items;
                console.log('this.columns:', JSON.stringify(this.columns));
                console.log('this.allData:', JSON.parse(JSON.stringify(this.allData)));
                this.error = undefined;
            })
            .catch(error => {
                this.error = reduceErrors(error);
                console.log('this.error', this.error);
                this.allData = undefined;
            });

           this.callgetPicklistOptions();
    }


    // Picklist change code start Here
    picklistChanged(event) {
        try {
            // collect values of piclist and update it to draft value
            let dataRecieved = JSON.parse(JSON.stringify(event.detail.data));
            console.log('Picklist Change Data : ', dataRecieved);
            let fieldApiName = dataRecieved.apiname;
            let ObjectIndex;

            ObjectIndex = this.records.findIndex(Item => { return Item.Id === dataRecieved.context });
            console.log(ObjectIndex);

        } catch (error) {
            console.log(error);
        }
    }

    updateDraftValues(updateItem) {
        // let records = JSON.parse(JSON.stringify(this.records));
        let findObjIndex = this.records.findIndex((arrItem, ind) => {
            if (typeof arrItem.Id === 'number') {
                return Number(arrItem.Id) === Number(updateItem.Id);
            } else {
                return arrItem.Id === updateItem.Id;
            }
        })
        if (updateItem.Id.length > 3) {
            console.log('Update Time : ', JSON.stringify(this.records));
            let includes = false;
            this.draftValues = updateItem
            console.log(this.draftValues);

        }
    }

    callgetPicklistOptions() {
        getPicklistOptions({ objectApiName: 'Account', fieldApiName: 'Industry' })
            .then(resp => {

                let tempColumns = [];

                let colJson = {
                    fieldName: 'Industry',
                    label: 'Industry',
                    type: 'picklist',
                    cellAttributes: { alignment: 'left' },
                    typeAttributes: {
                        placeholder: 'Industry',
                        options: resp,
                        value: {
                            fieldName: 'Industry'
                        },
                        context: { fieldName: 'Id' },
                        apiname: 'Industry'
                    },
                    wrapText: true

                };
                console.log('bef ' + this.columns);

                this.columns = [...this.columns, colJson]
                console.log('After picistl' +JSON.stringify( this.columns));
            })

            .catch(err => {
                console.log(err)
            });

        getPicklistOptions({
            objectApiName: 'Account',
            fieldApiName: 'SLA__c'
        })
            .then(resp => {
                let colJson = {
                    fieldName: 'SLA',
                    label: 'SLA',
                    type: 'picklist',
                    cellAttributes: { alignment: 'left' },
                    typeAttributes: {
                        placeholder: 'SLA',
                        options: resp,
                        value: {
                            fieldName: 'SLA'
                        },
                        context: { fieldName: 'Id' },
                        apiname: 'SLA__c'
                    },
                    wrapText: true

                };

                console.log(this.columns);

                this.columns = [...this.columns, colJson]
                console.log(this.columns);
            })

            .catch(err => {
                console.log(err)
            });

    }



    // Handlsave event to save Edit draftvalues and Record Insert save button
    handleSave(event) {
        var updatedField = event.detail.draftValues;
       // const updatedField2 = this.updatedFields;
        console.log('updatedField'+ JSON.stringify(updatedField));
        setSObjectRecords({ fieldData: JSON.stringify(updatedField), SFDCobjectApiName: this.SFDCobjectApiName })
            .then(result => {

                console.log(JSON.stringify("Apex update result: " + result));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Account(s) updated',
                        variant: 'success'
                    })
                );

                refreshApex(this.wiredRecords).then(() => {
                    this.draftValues = [];
                });

            }).catch(error => {

                console.log('Error is ' + JSON.stringify(error));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating or refreshing records',
                        message: error.body.message,
                        variant: 'error'
                    })
                );

            });


        // KeyIndex equles to zero

        this.acc.Id = this.keyIndex;
        this.keyIndex = 0;
        console.log(this.keyIndex);

    }
    handleCellChange(event) {
        console.log('draft val'+ JSON.stringify(event.detail.draftValues));
        // this.acc2["Name"] = event.detail.draftValues[0]["Name"] != undefined ? event.detail.draftValues[0]["Name"] : this.acc2["Name"];
        // this.acc2["Phone"] = event.detail.draftValues[0]["Phone"] != undefined ? event.detail.draftValues[0]["Phone"] : this.acc2["Phone"];
        // this.acc2["Fax"] = event.detail.draftValues[0]["Fax"] != undefined ? event.detail.draftValues[0]["Fax"] : this.acc2["Fax"];

        // console.log(this.acc2);
    }
    // Add row button logic
    addRow() {
        this.acc.Id = this.keyIndex;
        ++this.keyIndex;
        console.log(this.keyIndex);
        var newdata = JSON.parse(JSON.stringify(this.acc));
        var newdata2 = [newdata, ...this.records];
        this.records = newdata2;
    }

}
