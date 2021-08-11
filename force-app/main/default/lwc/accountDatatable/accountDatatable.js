/**
 * @author            : Vrushabh Uprikar
 * @last modified on  : 11-08-2021
 * @last modified by  : Vrushabh Uprikar
**/
import { LightningElement, wire, track, api } from 'lwc';
import { reduceErrors } from 'c/ldsUtils';
import getFieldSetAndRecords from '@salesforce/apex/picklistDatatableEditContoller.getFieldSetAndRecords';
import upsertSOBJRecord from '@salesforce/apex/picklistDatatableEditContoller.upsertSOBJRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getUpdatedDataOnly from '@salesforce/apex/picklistDatatableEditContoller.getUpdatedDataOnly';

export default class AccountDatatable extends LightningElement {
    @api isLoaded = false;
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
    listOfFieldsCopy = [];
    draftValues = [];
    AddButonCounter = 0;
    allValuesAndData;
    @track picklistPushVal = [];

    @track isNewRec = false;

    connectedCallback() {
        getFieldSetAndRecords({
            strObjectApiName: this.SFDCobjectApiName,
            strfieldSetName: this.fieldSetName
        })
            .then(async data => {
                this.isLoading = true;
                let objStr = JSON.parse(data);
                let listOfFields = JSON.parse(Object.values(objStr)[2]);
                this.listOfFieldsCopy = listOfFields;
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
                    this.isLoading = true;
                    if (element.type == 'picklist' || element.type == "picklist") {
                        let opt = []; // options
                        pickListValues.forEach(pic => {
                            pic.forEach(elem => {
                                if (element.fieldPath == elem.fieldApi) {
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
                    } else {
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
    // Picklist change code start Here
    picklistChanged(event) {
        event.stopPropagation();
        let dataRecieved = event.detail.data;
        let picklistObj = {
            Id: dataRecieved.context,
            [dataRecieved.apiname]: dataRecieved.value
        };
        this.updateDraftValues(picklistObj);
    }
    // Handlsave event to save Edit draftvalues and Record Insert save button
    async handleSave(event) {
        let copyDraftValues = this.draftValues;
        copyDraftValues.forEach((item) => {
            if (item.Id.length < 15) {
                // item.Id = '';
                delete item.Id;
            }
        });
        let dataStringify = JSON.stringify(copyDraftValues);

        console.log('FINAL PUSH : ', JSON.stringify(copyDraftValues));
        upsertSOBJRecord({ jSONSObject: dataStringify, sObjectApiName: this.SFDCobjectApiName })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Account updated',
                        variant: 'success'
                    })
                );

            }).then(_ => {
                console.log('Sucsss: Saved value' + JSON.stringify(copyDraftValues));
                this.draftValues = [];
                this.getUpdatedData();
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error updating or reloading record',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            });
    }

    handleCellChange(event) {
        event.preventDefault();
        this.updateDraftValues(event.detail.draftValues[0]);
        console.log('DraftValues handleCellChange ' + JSON.stringify(event.detail.draftValues));
    }

    async updateDraftValues(updateItem) {
        let draftValueChanged = false;
        let copyDraftValues = JSON.parse(JSON.stringify(this.draftValues));
        console.log('Draft values on send:', JSON.stringify(copyDraftValues));
        await copyDraftValues.forEach((item) => {
            if (item.Id == updateItem.Id) {
                for (let field in updateItem) {
                    item[field] = updateItem[field];
                }
                draftValueChanged = true;
            }
        });

        if (draftValueChanged) {
            this.draftValues = [...copyDraftValues];
        } else {
            this.draftValues = [...copyDraftValues, updateItem];
        }

        console.log('UpdateddraftValues :', JSON.stringify(this.draftValues));
        console.log('this.allData After Draft:', JSON.parse(JSON.stringify(this.allData)));
    }

    addRow() {
        this.isNewRec = true;
        console.log("add row function called");
        var dynamicArray = this.listOfFieldsCopy;
        console.log('dynamicArray:', dynamicArray);
        var blankObj =
        {
            Id: "row-" + this.AddButonCounter,
            attributes:
            {
                type: this.SFDCobjectApiName,
                url: "",
            },
        };

        for (let i = 0; i < dynamicArray.length; i++) {
            const { fieldPath } = dynamicArray[i];
            blankObj[fieldPath] = "";
        }
        console.log("blank_object", JSON.stringify(blankObj));

        this.allData = [blankObj, ...this.allData];
        console.log('this.allData After :', JSON.parse(JSON.stringify(this.allData)));
        this.AddButonCounter = this.AddButonCounter + 1;
    }

    getUpdatedData() {
        getUpdatedDataOnly({
            strObjectApiName: this.SFDCobjectApiName,
            strfieldSetName: this.fieldSetName
        })
            .then(async data => {

                let objStr = JSON.parse(data);
                var listOfRecords = JSON.parse(Object.values(objStr)[0]);
                console.log('listOfRecords: UPDATED', JSON.stringify(listOfRecords)); // Data
                var xx = JSON.stringify(listOfRecords);
                this.allData = JSON.parse(xx);
                this.allDataOrgCopy = JSON.parse(xx);
            })
            .catch(error => {
                this.error = reduceErrors(error);
                console.log('this.error', this.error);
            });
    }
}
