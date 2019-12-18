const fs = require('fs');
const PDFDocument = require('pdfkit')

const companyAddress_y = 30
const companyAddress_height = 35
const company_tel_y = companyAddress_y + companyAddress_height
const taxpayer_y = company_tel_y + 15
const header_width = 180
const header_top_left_x = 395
const purchase_top_left_x = 20
const purchase_top_left_y = taxpayer_y + 15
const purchase_header_height = 92
const linePurchaseWidth = 0.5
const contact_text_label_width = 60
const contact_text_height = 10
const title_space = 2
const purchase_order_top_left_y = taxpayer_y + purchase_header_height + 18
const column_1_width = 30
const column_2_width = 50
const column_3_width = 235
const column_4_width = 60
const column_5_width = 60
const column_6_width = 50
const column_7_width = 70
let purchase_order_table_height = 388
const purchase_order_table_width = 555
const default_font_size = 7


async function generatePurchaseOrderFilePDF(data_items, pathFile) {

    return new Promise(function (resolve, reject) {

        console.log('generatePurchaseOrderFilePDF')

        let file = fs.createWriteStream(pathFile)
        let doc = new PDFDocument({
            autoFirstPage: false,
            bufferPages: true
        })
        try {
            doc.pipe(file);

            const responsePurchaseOrder = data_items
            const responsePurchaseOrderItems = data_items.items

            let i, j, temparray
            const chunk = 30;
            let items_split = []
            for (i = 0, j = responsePurchaseOrderItems.length; i < j; i += chunk) {
                temparray = responsePurchaseOrderItems.slice(i, i + chunk);
                items_split.push(temparray)
            }

            // calculate page
            let pages = 1
            if (responsePurchaseOrderItems.length > 18) {
                const new_items = responsePurchaseOrderItems.length - 18
                pages = Math.ceil(new_items / 30) + 1
            }

            // add page
            for (let i = 0; i < pages; i++) {
                doc.addPage({
                    size: [595, 841],
                    margins: {
                        top: 30,
                        bottom: 20,
                        left: 20,
                        right: 30
                    }
                })
            }

            // draw pdf
            doc.font('./resources/fonts/Prompt-Regular.ttf')
            doc.fontSize(default_font_size);
            const range = doc.bufferedPageRange(); // => { start: 0, count: 2 }
            for (i = range.start, end = range.start + range.count, range.start <= end; i < end; i++) {
                doc.switchToPage(i);
                generateHeader(doc, {})
                generatePurchaseContact(doc, responsePurchaseOrder)
                generatePurchaseOrderTable(doc, items_split[i] || [])
                if (i === end - 1) {
                    generateResult(doc, responsePurchaseOrder)
                }

            }

            doc.end()
            resolve({
                fileStatus: true,
                file: file
            })
        } catch (err) {
            console.log('generatePurchaseOrderFilePDF error => ',err)
            reject(err)
        }
    });





}


function generateHeader(doc, data) {

    // draw header line
    const header_top_left_y = 30
    const header_height = 50
    const lineWidth = 0.8
    doc.lineWidth(lineWidth)
    doc.lineJoin('round')
        .rect(header_top_left_x,
            header_top_left_y,
            header_width,
            header_height)
        .stroke();

    //draw header
    const header_th = 'ใบสั่งซื้อ'
    const header_en = 'Purchase Order'
    doc.fontSize(9)
    doc.text(`${header_th}`, header_top_left_x, (header_top_left_y + 9), {
        align: 'center',
        width: header_width
    })
    doc.text(`${header_en}`, header_top_left_x, (header_top_left_y + 23), {
        align: 'center',
        width: header_width
    })
}



function generatePurchaseContact(doc, data) {
    // draw line purchase contact
    const purchase_header_width = 373
    doc.lineWidth(linePurchaseWidth)
    doc.lineJoin('round')
        .rect(purchase_top_left_x,
            purchase_top_left_y,
            purchase_header_width,
            purchase_header_height)
        .stroke();

    // draw contact label
    const contact_th = 'ผู้ติดต่อ'
    const contact_th_x = purchase_top_left_x + 7
    const contact_th_y = purchase_top_left_y + 2
    const contact_label_text_options = {
        align: 'left',
        width: contact_text_label_width
    }
    doc.fontSize(default_font_size);
    doc.text(`${contact_th}`, contact_th_x, contact_th_y, contact_label_text_options)
    const contact_en = 'Contact'
    const contact_en_y = contact_th_y + contact_text_height
    doc.text(`${contact_en}`, contact_th_x, contact_en_y, contact_label_text_options)

    const contact_name_th = 'ผู้จำหน่าย'
    const contact_name_th_y = contact_en_y + contact_text_height + title_space
    doc.text(`${contact_name_th}`, contact_th_x, contact_name_th_y, contact_label_text_options)
    const contact_name_en = 'Name'
    const contact_name_en_y = contact_name_th_y + contact_text_height
    doc.text(`${contact_name_en}`, contact_th_x, contact_name_en_y, contact_label_text_options)

    const contact_address_th = 'ที่อยู่'
    const contact_address_th_y = contact_name_en_y + contact_text_height + title_space
    doc.text(`${contact_address_th}`, contact_th_x, contact_address_th_y, contact_label_text_options)
    const contact_address_en = 'Address'
    const contact_address_en_y = contact_address_th_y + contact_text_height
    doc.text(`${contact_address_en}`, contact_th_x, contact_address_en_y, contact_label_text_options)

    const contact_tel_th = 'โทรศัพท์'
    const contact_tel_th_y = contact_address_en_y + contact_text_height + title_space
    doc.text(`${contact_tel_th}`, contact_th_x, contact_tel_th_y, contact_label_text_options)
    const contact_tel_en = 'Tel'
    const contact_tel_en_y = contact_tel_th_y + contact_text_height
    doc.text(`${contact_tel_en}`, contact_th_x, contact_tel_en_y, contact_label_text_options)

    const contact_fax_th = 'โทรสาร'
    const contact_fax_th_x = contact_th_x + 200
    const contact_fax_th_y = contact_address_en_y + contact_text_height + title_space
    doc.text(`${contact_fax_th}`, contact_fax_th_x, contact_fax_th_y, contact_label_text_options)
    const contact_fax_en = 'Fax'
    doc.text(`${contact_fax_en}`, contact_fax_th_x, contact_tel_en_y, contact_label_text_options)


    // draw contact value
    const value_contact = data.warehouseNameTH || data.warehouseNameEN || ''
    const value_contact_name = data.vendorNameTH || data.vendorNameEN || ''
    const value_contact_address = ''
    const value_contact_tel = ''
    const value_contact_fax = ''

    const value_contact_th_x = contact_text_label_width + 10
    const value_contact_th_y = purchase_top_left_y + 2
    const contact_text_value_width = purchase_header_width - 70
    doc.fontSize(default_font_size);
    doc.text(`${value_contact}`, value_contact_th_x, value_contact_th_y, {
        align: 'left',
        width: contact_text_value_width
    })
    const value_contact_name_y = contact_en_y + contact_text_height + title_space
    doc.text(`${value_contact_name}`, value_contact_th_x, value_contact_name_y, {
        align: 'left',
        width: contact_text_value_width
    })
    const value_contact_address_y = contact_name_en_y + contact_text_height + title_space
    doc.text(`${value_contact_address}`, value_contact_th_x, value_contact_address_y, {
        align: 'left',
        width: contact_text_value_width
    })
    const value_contact_tel_y = contact_address_en_y + contact_text_height + title_space
    doc.text(`${value_contact_tel}`, value_contact_th_x, value_contact_tel_y, {
        align: 'left',
        width: contact_text_value_width - 200
    })
    const value_contact_fax_x = contact_fax_th_x + 50
    doc.text(`${value_contact_fax}`, value_contact_fax_x, contact_fax_th_y, {
        align: 'left',
        width: contact_text_value_width - 200
    })

    // draw line purchase date
    const purchase_date_top_left_x = header_top_left_x
    const purchase_date_top_left_y = taxpayer_y + 15
    const purchase_date_header_width = header_width
    const purchase_date_header_height = purchase_header_height

    doc.lineWidth(linePurchaseWidth)

    doc.lineJoin('round')
        .rect(purchase_date_top_left_x,
            purchase_date_top_left_y,
            purchase_date_header_width,
            purchase_date_header_height)
        .stroke();

    // draw purchase date label
    const label_purchase_date_th = 'วันที่'
    const label_purchase_date_th_x = purchase_date_top_left_x + 7
    const label_purchase_date_th_y = purchase_top_left_y + 2
    const contact_text_label_options = {
        align: 'left',
        width: contact_text_label_width
    }
    doc.fontSize(default_font_size);
    doc.text(`${label_purchase_date_th}`, label_purchase_date_th_x, label_purchase_date_th_y, contact_text_label_options)
    const label_purchase_date_en = 'Date'
    const label_purchase_date_en_y = label_purchase_date_th_y + contact_text_height
    doc.text(`${label_purchase_date_en}`, label_purchase_date_th_x, label_purchase_date_en_y, contact_text_label_options)

    const label_order_no_th = 'เลขที่'
    const label_order_no_th_y = label_purchase_date_en_y + contact_text_height + title_space
    doc.text(`${label_order_no_th}`, label_purchase_date_th_x, label_order_no_th_y, contact_text_label_options)
    const label_order_no_en = 'Order No.'
    const label_order_no_en_y = label_order_no_th_y + contact_text_height
    doc.text(`${label_order_no_en}`, label_purchase_date_th_x, label_order_no_en_y, contact_text_label_options)

    const label_refer_pr_no_th = 'เลขที่ใบขอซื้อ'
    const label_refer_pr_no_th_y = label_order_no_en_y + contact_text_height + title_space
    doc.text(`${label_refer_pr_no_th}`, label_purchase_date_th_x, label_refer_pr_no_th_y, contact_text_label_options)
    const label_refer_pr_no_en = 'Refer PR No.'
    const label_refer_pr_no_en_y = label_refer_pr_no_th_y + contact_text_height
    doc.text(`${label_refer_pr_no_en}`, label_purchase_date_th_x, label_refer_pr_no_en_y, contact_text_label_options)

    const label_delivery_date_th = 'กำหนดส่งสินค้า'
    const label_delivery_date_th_y = label_refer_pr_no_en_y + contact_text_height + title_space
    doc.text(`${label_delivery_date_th}`, label_purchase_date_th_x, label_delivery_date_th_y, contact_text_label_options)
    const label_delivery_date_th_en = 'Delivery Date'
    const label_delivery_date_en_y = label_delivery_date_th_y + contact_text_height
    doc.text(`${label_delivery_date_th_en}`, label_purchase_date_th_x, label_delivery_date_en_y, contact_text_label_options)

    // draw purchase date value
    const d = new Date(data.transactionDate);
    const date = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear()
    const value_purchase_date = date || ''
    const value_order_no_th = data.poNumber || ''
    const value_refer_pr_no_th = ''
    const value_delivery_date_th = ''

    const purchase_date_value_width = 100
    const value_purchase_date_x = label_purchase_date_th_x + 55
    const value_purchase_date_y = label_purchase_date_th_y
    const purchase_date_value_text_options = {
        align: 'left',
        width: purchase_date_value_width
    }
    doc.text(`${value_purchase_date}`, value_purchase_date_x, value_purchase_date_y, purchase_date_value_text_options)


    const value_order_no_th_y = label_purchase_date_en_y + contact_text_height + title_space
    doc.text(`${value_order_no_th}`, value_purchase_date_x, value_order_no_th_y, purchase_date_value_text_options)


    const value_refer_pr_no_th_y = label_order_no_en_y + contact_text_height + title_space
    doc.text(`${value_refer_pr_no_th}`, value_purchase_date_x, value_refer_pr_no_th_y, purchase_date_value_text_options)


    const value_delivery_date_th_y = label_refer_pr_no_en_y + contact_text_height + title_space
    doc.text(`${value_delivery_date_th}`, value_purchase_date_x, value_delivery_date_th_y, purchase_date_value_text_options)
}



function generatePurchaseOrderTable(doc, data) {

    purchase_order_table_height = 388

    doc.lineWidth(linePurchaseWidth)
    const table_header_height = 25
    // table header
    doc.lineJoin('round')
        .rect(purchase_top_left_x,
            purchase_order_top_left_y,
            purchase_order_table_width,
            table_header_height)
        .stroke();


    // title column 1
    const column_1_x = purchase_top_left_x + column_1_width
    const title_column_1_th = 'ลำดับ'
    const title_column_1_en = 'No.'
    const title_column_1_y = purchase_order_top_left_y + 2
    doc.fontSize(default_font_size);
    doc.text(`${title_column_1_th}`, purchase_top_left_x, title_column_1_y, {
        align: 'center',
        width: column_1_width
    }).text(`${title_column_1_en}`, {
        align: 'center',
        width: column_1_width
    })


    const column_2_x = column_1_x + column_2_width
    const title_column_2_th = 'รหัสสินค้า'
    const title_column_2_en = 'Product Code'
    doc.text(`${title_column_2_th}`, column_1_x, title_column_1_y, {
        align: 'center',
        width: column_2_width
    }).text(`${title_column_2_en}`, {
        align: 'center',
        width: column_2_width
    })


    const column_3_x = column_2_x + column_3_width
    const title_column_3_th = 'รายละเอียด'
    const title_column_3_en = 'Description'
    doc.text(`${title_column_3_th}`, column_2_x, title_column_1_y, {
        align: 'center',
        width: column_3_width
    }).text(`${title_column_3_en}`, {
        align: 'center',
        width: column_3_width
    })


    const column_4_x = column_3_x + column_4_width
    const title_column_4_th = 'จำนวน'
    const title_column_4_en = 'Quantity'
    doc.text(`${title_column_4_th}`, column_3_x, title_column_1_y, {
        align: 'center',
        width: column_4_width
    }).text(`${title_column_4_en}`, {
        align: 'center',
        width: column_4_width
    })


    const column_5_x = column_4_x + column_5_width
    const title_column_5_th = 'หน่วยละ'
    const title_column_5_en = 'Unit'
    doc.text(`${title_column_5_th}`, column_4_x, title_column_1_y, {
        align: 'center',
        width: column_5_width
    }).text(`${title_column_5_en}`, {
        align: 'center',
        width: column_5_width
    })

    const column_6_x = column_5_x + column_6_width
    const title_column_6_th = 'ส่วนลด'
    const title_column_6_en = 'Discount'
    doc.text(`${title_column_6_th}`, column_5_x, title_column_1_y, {
        align: 'center',
        width: column_6_width
    }).text(`${title_column_6_en}`, {
        align: 'center',
        width: column_6_width
    })

    const title_column_7_th = 'จำนวนเงิน'
    const title_column_7_en = 'Amount'
    doc.text(`${title_column_7_th}`, column_6_x, title_column_1_y, {
        align: 'center',
        width: column_7_width
    }).text(`${title_column_7_en}`, {
        align: 'center',
        width: column_7_width
    })

    let order_y = purchase_order_top_left_y + table_header_height + 3

    for (let i = 0; i < data.length; i++) {


        const seq = data[i].seq
        const productItemCode = data[i].productItemCode || ''
        const productDescription = data[i].productItemNameTH || data[i].productItemNameEN || ''
        const quantity = `${data[i].quantity || 0} ${data[i].purchaseUnitNameTH || data[i].purchaseUnitNameEN || ''}`
        const standardPrice = data[i].unitPrice || '0.00'
        let discountByAmount = data[i].discountByAmount || data[i].discountByPercentAsAmount || '0.00'
        if (data[i].discountByAmount != '' && data[i].discountByPercentAsAmount != '') {
            discountByAmount = parseFloat(data[i].discountByAmount) + parseFloat(data[i].discountByPercentAsAmount)
            discountByAmount = discountByAmount.toFixed(2)
        }
        const grandTotalPrice = data[i].grandTotalPrice || '0.00'


        doc.text(`${seq}`, purchase_top_left_x, order_y, {
            align: 'center',
            width: column_1_width
        })
        doc.text(`${productItemCode}`, column_1_x, order_y, {
            align: 'center',
            width: column_2_width
        })
        doc.text(`${productDescription}`, column_2_x + 5, order_y, {
            align: 'left',
            width: column_3_width - 10
        })

        doc.text(`${quantity}`, column_3_x + 5, order_y, {
            align: 'right',
            width: column_4_width - 10
        })

        doc.text(`${standardPrice}`, column_4_x + 5, order_y, {
            align: 'right',
            width: column_5_width - 10
        })

        doc.text(`${discountByAmount}`, column_5_x + 5, order_y, {
            align: 'right',
            width: column_6_width - 10
        })

        doc.text(`${grandTotalPrice}`, column_6_x + 5, order_y, {
            align: 'right',
            width: column_7_width - 10
        })

        order_y += 20

        if (i > 17) {
            purchase_order_table_height += 20
        }
    }

    //  draw table
    doc.lineJoin('round')
        .rect(purchase_top_left_x,
            purchase_order_top_left_y,
            purchase_order_table_width,
            purchase_order_table_height)
        .stroke();

    // column 1
    const column_height = purchase_order_top_left_y + purchase_order_table_height
    doc.moveTo(column_1_x, purchase_order_top_left_y)
        .lineTo(column_1_x, column_height)
        .stroke()

    // column 2
    doc.moveTo(column_2_x, purchase_order_top_left_y)
        .lineTo(column_2_x, column_height)
        .stroke()

    // column 3
    doc.moveTo(column_3_x, purchase_order_top_left_y)
        .lineTo(column_3_x, column_height)
        .stroke()

    // column 4
    doc.moveTo(column_4_x, purchase_order_top_left_y)
        .lineTo(column_4_x, column_height)
        .stroke()

    // column 5
    doc.moveTo(column_5_x, purchase_order_top_left_y)
        .lineTo(column_5_x, column_height)
        .stroke()

    // column 6
    doc.moveTo(column_6_x, purchase_order_top_left_y)
        .lineTo(column_6_x, column_height)
        .stroke()


}

function generateResult(doc, data) {

    const purchase_order_table_amount_y = purchase_order_top_left_y + purchase_order_table_height
    const purchase_order_table_amount_height = 80

    doc.lineJoin('round')
        .rect(purchase_top_left_x,
            purchase_order_table_amount_y,
            purchase_order_table_width,
            purchase_order_table_amount_height)
        .stroke();
    doc.lineWidth(linePurchaseWidth)

    const note = 'หมายเหตุ : '
    doc.text(`${note}`, purchase_top_left_x + 5, purchase_order_table_amount_y + 15, {
        align: 'left',
        width: purchase_order_table_width - column_5_width - column_6_width - column_7_width - 10
    })

    // const amount_quantity_label = 'รวมจำนวนสินค้า'
    // doc.text(`${amount_quantity_label}`, purchase_top_left_x + column_1_width + column_2_width, purchase_order_table_amount_y + 5, {
    //     align: 'right',
    //     width: column_3_width - 5
    // })

    // const amount_quantity = '1,020.00'
    // doc.text(`${amount_quantity}`, purchase_top_left_x + column_1_width + column_2_width + column_3_width, purchase_order_table_amount_y + 5, {
    //     align: 'right',
    //     width: column_4_width - 5
    // })

    const row_result_height = 16
    const row_result_stop_x = 575
    const column_4_x = purchase_top_left_x + column_1_width + column_2_width + column_3_width + column_4_width

    doc.moveTo(column_4_x, purchase_order_table_amount_y)
        .lineTo(column_4_x, purchase_order_table_amount_y + 80)
        .stroke()

    doc.moveTo(column_4_x + column_5_width + column_6_width, purchase_order_table_amount_y)
        .lineTo(column_4_x + column_5_width + column_6_width, purchase_order_table_amount_y + 80)
        .stroke()

    const row_result_amount_height = purchase_order_table_amount_y + row_result_height
    doc.moveTo(column_4_x, row_result_amount_height)
        .lineTo(row_result_stop_x, row_result_amount_height)
        .stroke()

    const result_amount_label = 'รวมราคา / Amount'
    const result_discount_label = 'ส่วนลด / Discount'
    const result_subtotal_label = 'มูลค่า / Sub Total'
    const result_vat_label = `ภาษีมูลค่าเพิ่ม / VAT ${data.vatPercent} %`
    const result_net_amount_label = 'ยอดเงินสุทธิ / Net Amount'

    const result_amount_label_x = column_4_x + 10
    const result_amount_label_y = purchase_order_table_amount_y + 2
    const result_amount_label_width = (column_5_width + column_6_width) - 20
    const result_amount_label_space = 16
    const result_amount_label_text_options = {
        align: 'left',
        width: result_amount_label_width
    }
    doc.text(`${result_amount_label}`, result_amount_label_x, result_amount_label_y, result_amount_label_text_options)
    const result_discount_label_y = result_amount_label_y + result_amount_label_space
    doc.text(`${result_discount_label}`, result_amount_label_x, result_discount_label_y, result_amount_label_text_options)
    const result_subtotal_label_y = result_discount_label_y + result_amount_label_space
    doc.text(`${result_subtotal_label}`, result_amount_label_x, result_subtotal_label_y, result_amount_label_text_options)
    const result_vat_label_y = result_subtotal_label_y + result_amount_label_space
    doc.text(`${result_vat_label}`, result_amount_label_x, result_vat_label_y, result_amount_label_text_options)
    const result_net_amount_label_y = result_vat_label_y + result_amount_label_space
    doc.text(`${result_net_amount_label}`, result_amount_label_x, result_net_amount_label_y, result_amount_label_text_options)

    const result_amount = data.billTotalAmount || '0.00'
    const result_discount = data.billDiscountByAmount || '0.00'
    const result_subtotal = data.billTotalAmountAfterDiscount || '0.00'
    const result_vat = data.vatAmount || '0.00'
    const result_net_amount = data.grandTotal || '0.00'
    const thaiBath = require('./thaiBath')
    const result_net_amount_thai = `(${thaiBath.ArabicNumberToText(data.grandTotal)})` || '0.00'

    doc.text(`${result_net_amount_thai}`, purchase_top_left_x + 10, result_net_amount_label_y, {
        align: 'left',
        width: purchase_order_table_width - column_5_width - column_6_width - column_7_width - 10
    })

    const result_amount_x = column_4_x + (column_5_width + column_6_width) + 5
    const result_amount_width = column_7_width - 10
    const result_amount_text_options = {
        align: 'right',
        width: result_amount_width
    }
    doc.text(`${result_amount}`, result_amount_x, result_amount_label_y, result_amount_text_options)
    doc.text(`${result_discount}`, result_amount_x, result_discount_label_y, result_amount_text_options)
    doc.text(`${result_subtotal}`, result_amount_x, result_subtotal_label_y, result_amount_text_options)
    doc.text(`${result_vat}`, result_amount_x, result_vat_label_y, result_amount_text_options)
    doc.text(`${result_net_amount}`, result_amount_x, result_net_amount_label_y, result_amount_text_options)


    const row_result_discount_height = row_result_amount_height + row_result_height
    doc.moveTo(column_4_x, row_result_discount_height)
        .lineTo(row_result_stop_x, row_result_discount_height)
        .stroke()
    const row_result_subtotal_height = row_result_discount_height + row_result_height
    doc.moveTo(column_4_x, row_result_subtotal_height)
        .lineTo(row_result_stop_x, row_result_subtotal_height)
        .stroke()
    const row_result_vat_height = row_result_subtotal_height + row_result_height
    doc.moveTo(purchase_top_left_x, row_result_vat_height)
        .lineTo(row_result_stop_x, row_result_vat_height)
        .stroke()

    const covenant_1 = '1. บริษัทฯ มีสิทธิที่จะส่งสินค้าคืนกลับผู้ขาย โดยให้ผู้ขายออกค่าใช้จ่ายในการขนส่งหรือมีสิทธิยกเลิกการสั่งซื้อ \nถ้าสินค้าที่ส่งไม่เป็นไปตามที่กำหนดไว้ในใบสั่งซื้อ'
    const covenant_2 = '2. ใบสั่งซื้อจะมีผลต่อเมื่อมีลายเซ็นต์อนุมัติของผู้มีอำนาจ พร้อมประทับตราของบริษัทฯ'
    const covenant_y = purchase_order_table_amount_y + purchase_order_table_amount_height + 5
    doc.text(`${covenant_1}`, purchase_top_left_x, covenant_y, {
        align: 'left',
    }).text(`${covenant_2}`)

    const signature_array = [
        {
            title: 'ผู้สั่งสินค้า / Purchase'
        },
        {
            title: 'ผู้อนุมัติ / Authorized by'
        },
        {
            title: 'ผู้ตรวจสอบ / Checked by'
        },
        {
            title: 'ผู้ขาย / Supplier ได้รับของเรียบร้อยแล้ว'
        }
    ]
    const signature_y = covenant_y + 45
    const signature_width = 138
    const signature_height = 90
    const signature_space = 0.75
    const sigature_fill = '..................................................................................................'
    const sigature_fill_date = 'วันที่ / Date......................................................................'
    let signature_x = purchase_top_left_x

    signature_array.forEach(item => {

        doc.lineJoin('round')
            .rect(signature_x,
                signature_y,
                signature_width,
                signature_height)
            .stroke();
        const signature_label = item.title || ''
        const signature_label_x = signature_x + 5
        const signature_label_y = signature_y + 5
        const signature_label_text_options = {
            align: 'left',
            width: signature_width - 10
        }
        const sigature_fill_y = signature_y + signature_height - 30
        const sigature_fill_date_y = signature_y + signature_height - 15
        doc.text(`${signature_label}`, signature_label_x, signature_label_y, signature_label_text_options)
        doc.text(`${sigature_fill}`, signature_label_x, sigature_fill_y, signature_label_text_options)
        doc.text(`${sigature_fill_date}`, signature_label_x, sigature_fill_date_y, signature_label_text_options)

        signature_x += (signature_width + signature_space)
    })

}

module.exports = {
    generatePurchaseOrderFilePDF
}