/**
 * @File Name          : accountDataTable.js
 * @Description        :
 * @Author             :
 * @Group              :
 * @Last Modified By   : Vrushabh Uprikar
 * @Last Modified On   : 03-08-2021
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

//  const column=[
//      { "label" : "Name", "apiName" : "Name" ,"fieldType":"text","objectName":"Account", "fieldName": "Name", editable: true },
//      { "label" : "Phone", "apiName" : "Phone" ,"fieldType":"text","type":"phone","objectName":"Account","fieldName": "Phone", editable: true },
//      { "label" : "Total Spending", "apiName" : "Total_Spending__c" ,"fieldType":"text","objectName":"Account","fieldName": "Total_Spending__c", editable: true },
//  ];

export default class AccountDatatable extends LightningElement {

    @track allData = []; // Datatable
    allDataOrgCopy = []; // DatatableOrignalCpy
    @track columns = [];
    @track copyColumns = [];
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


    connectedCallback()
    {
        getFieldSetAndRecords({
            strObjectApiName: this.SFDCobjectApiName,
            strfieldSetName: this.fieldSetName
        })
            .then(async data => {

                let objStr = JSON.parse(data);

                let listOfFields = JSON.parse(Object.values(objStr)[2]);
                console.log('listOfFields:', JSON.stringify(listOfFields)); // Fields

                var listOfRecords = JSON.parse(Object.values(objStr)[1]);
                console.log('listOfRecords:', JSON.stringify(listOfRecords)); // Data

                var pickListValues = JSON.parse(Object.values(objStr)[0]);
                console.log('pickListValues:', JSON.stringify(pickListValues)); // Picklist
                var pickListArray = [];
                pickListValues.forEach(pic => {
                    pic.map(elem => {
                        pickListArray.push(elem);
                    });
                });
                // console.log('pickListArray:', pickListArray);
                var xx = JSON.stringify(listOfRecords);
                this.allData = JSON.parse(xx);
                this.allDataOrgCopy = JSON.parse(xx);

                await listOfFields.map(element => {

                    if (element.type == 'picklist' || element.type == "picklist")
                    {
                        let opt = []; // options
                        pickListValues.forEach(pic => {
                            pic.forEach(elem => {
                                if (element.fieldPath == elem.fieldApi)
                                {
                                    let var1 =
                                    {
                                        value: elem.value,
                                        label: elem.label
                                    };
                                    opt.push(var1);
                                }
                            });
                        });

                        let colJson =
                        {
                            fieldName: element.fieldPath,
                            label: element.label,
                            type: element.type,
                            editable: true,
                            cellAttributes: { alignment: 'center' },
                            typeAttributes:
                            {
                                placeholder: element.label,
                                options: opt,
                                value:
                                {
                                    fieldName: element.fieldPath
                                },
                                context: { fieldName: 'Id' },
                                apiname: element.fieldPath,
                                variant: 'label-hidden',
                                name: element.label,
                                label: element.label
                            },
                            wrapText: true
                        };
                        this.columns.push(colJson);
                        console.log('colJson:', colJson);

                    } else
                     {
                        let elm = {
                            label: element.label,
                            apiName: element.fieldPath,
                            type: element.type,
                            fieldType: 'text',
                            objectName: this.SFDCobjectApiName,
                            fieldName: element.fieldPath,
                            editable: true,
                        };
                        this.columns.push(elm);
                        console.log('elm:', elm);
                    }
                });

            })
            .then(_ => {
                var parseCol = JSON.stringify(this.columns);
                this.columns = JSON.parse(parseCol);
                console.table(this.columns);
                console.log('this.allData:', JSON.parse(JSON.stringify(this.allData)));
                this.error = undefined;
            })
            .catch(error => {
                this.error = reduceErrors(error);
                console.log('this.error', this.error);
                this.allData = undefined;
            });
    }

    // async call for piclist

    //  getPickLisHandleAsync(element)
    // {
    //     getPicklistOptions({ objectApiName: this.SFDCobjectApiName,
    //         fieldApiName: element.fieldPath })
    //         .then( async resp => {
    //             var colJson =
    //             {
    //                 fieldName: element.fieldPath,
    //                 label: element.label,
    //                 type: element.type,
    //                 editable: true,
    //                 cellAttributes: { alignment: 'center' },
    //                 typeAttributes: {
    //                     placeholder: element.label,
    //                     options: resp,
    //                     value: {
    //                         fieldName: element.fieldPath
    //                     },
    //                     context: { fieldName: 'Id' },
    //                     apiname: element.fieldPath
    //                 },
    //                 wrapText: true
    //             };
    //             console.log(' colJson ' + JSON.stringify(colJson));
    //             this.columns.push(colJson);
    //         })
    //         .catch(error => {
    //             this.error = reduceErrors(error);
    //             console.log('this.error', this.error);
    //         });
    // }



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

    // Handlsave event to save Edit draftvalues and Record Insert save button
    handleSave(event) {
        var updatedField = event.detail.draftValues;
        // const updatedField2 = this.updatedFields;
        console.log('updatedField' + JSON.stringify(updatedField));
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
        console.log('draft val' + JSON.stringify(event.detail.draftValues));
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
