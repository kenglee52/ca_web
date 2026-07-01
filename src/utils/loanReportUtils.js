// src/utils/loanReportUtils.js
import ExcelJS from 'exceljs';

// ຟັງຊັນຈັດຮູບແບບຕົວເລກເງິນ
export const fmtMoney=(num) => {
  if(num===null||num===undefined||isNaN(num)) return '0';
  return Number(num).toLocaleString('lo-LA');
};

// ຟັງຊັນຈັດຮູບແບບວັນທີ
export const fmtDate=(date) => {
  if(!date) return '-';
  return new Date(date).toLocaleString('lo-LA',{dateStyle: 'medium',timeStyle: 'short'});
};

// ຟັງຊັນຈັດຮູບແບບວັນທີແບບສັ້ນ (ສະເພາະວັນທີ)
export const fmtDateShort=(date) => {
  if(!date) return '-';
  return new Date(date).toLocaleDateString('lo-LA');
};

// ==========================================
// 1. ຟັງຊັນ EXPORT EXCEL (ຮູບແບບຕາມ PDF ເປະ)
// ==========================================
export const exportToExcel=async (reportData,fileName='loan-report') => {
  if(!reportData||!reportData.data) return;

  const {data: loan}=reportData;
  const borrower=loan.borrower||{};
  const assessment=loan.assessment||{};
  const businessIncomes=borrower.businessIncomes||[];

  const workbook=new ExcelJS.Workbook();
  const worksheet=workbook.addWorksheet('Loan Assessment Report');

  // 5 ຄໍລໍາ (A,B,C,D,E) - ສ່ວນ 2-column ຈະ merge B:E ເປັນ value ດຽວ,
  // ສ່ວນ 4-column ຈະ merge D:E ເປັນ value2 ເພື່ອໃຫ້ Preparer/Approver (5 ຖັນແທ້) ສະເໝີກັນກັບສ່ວນອື່ນ
  worksheet.columns=[
    {width: 45}, // A - label
    {width: 30}, // B - value / label2
    {width: 45}, // C - label2 (4-col mode) / value continuation
    {width: 30}, // D - value2 (start) / signature col in Preparer section
    {width: 30}, // E - value continuation / comments col in Preparer section
  ];

  // Colors
  const darkBlue='FF1F4E78';
  const lightBlue='FFD9E1F2';
  const lightOrange='FFFED8B1';
  const white='FFFFFFFF';
  const gray='FFF0F0F0';

  const titleStyle={
    font: {name: 'Noto Sans Lao',size: 16,bold: true,color: {argb: white}},
    fill: {type: 'pattern',pattern: 'solid',fgColor: {argb: darkBlue}},
    alignment: {horizontal: 'center',vertical: 'center',wrapText: true}
  };

  const subTitleStyle={
    font: {name: 'Noto Sans Lao',size: 11,bold: true,color: {argb: darkBlue}},
    alignment: {horizontal: 'center',vertical: 'center',wrapText: true}
  };

  const sectionHeaderStyle={
    font: {name: 'Noto Sans Lao',size: 11,bold: true,color: {argb: white}},
    fill: {type: 'pattern',pattern: 'solid',fgColor: {argb: darkBlue}},
    alignment: {horizontal: 'left',vertical: 'center',wrapText: true}
  };

  const labelStyle={
    font: {name: 'Noto Sans Lao',size: 10,bold: false},
    fill: {type: 'pattern',pattern: 'solid',fgColor: {argb: lightBlue}},
    alignment: {horizontal: 'left',vertical: 'center',wrapText: true}
  };

  const valueStyle={
    font: {name: 'Noto Sans Lao',size: 10},
    alignment: {horizontal: 'left',vertical: 'center',wrapText: true}
  };

  const valueRightStyle={
    font: {name: 'Noto Sans Lao',size: 10},
    alignment: {horizontal: 'right',vertical: 'center',wrapText: true}
  };

  const orangeHighlightStyle={
    font: {name: 'Noto Sans Lao',size: 10,bold: true},
    fill: {type: 'pattern',pattern: 'solid',fgColor: {argb: lightOrange}},
    alignment: {horizontal: 'left',vertical: 'center',wrapText: true}
  };

  const subHeaderRowStyle={
    font: {name: 'Noto Sans Lao',size: 10,bold: true},
    fill: {type: 'pattern',pattern: 'solid',fgColor: {argb: gray}},
    alignment: {horizontal: 'left',vertical: 'center',wrapText: true}
  };

  const borderThin={
    top: {style: 'thin',color: {argb: 'FF000000'}},
    left: {style: 'thin',color: {argb: 'FF000000'}},
    bottom: {style: 'thin',color: {argb: 'FF000000'}},
    right: {style: 'thin',color: {argb: 'FF000000'}}
  };

  let r=0; // running row tracker for merges

  // --- TITLE ---
  const titleRow=worksheet.addRow(['ແບບຟອມການປະເມີນເງິນກູ້/Loan Assessment Tool']);
  titleRow.height=25;
  titleRow.getCell(1).style=titleStyle;
  worksheet.mergeCells(`A${titleRow.number}:E${titleRow.number}`);

  // --- SUB TITLE (2 ແຖວ ກາງ) ---
  const loanTypeLabel=loan.loanType==='PERSONAL_SALARY_GUARANTEE'
    ? 'ເງິນກູ້ສ່ວນບຸກຄົນແບບບໍ່ມີຫຼັກຊັບ/ (Salary Guarantee)'
    :(loan.loanPurpose||'ເງິນກູ້ສ່ວນບຸກຄົນ');
  const sub1=worksheet.addRow(['ເງິນກູ້ສ່ວນບຸກຄົນ']);
  sub1.getCell(1).style=subTitleStyle;
  worksheet.mergeCells(`A${sub1.number}:E${sub1.number}`);
  const sub2=worksheet.addRow(['ເງິນກູ້ພະນັກງານໃນເຄືອ I.']);
  sub2.getCell(1).style=subTitleStyle;
  worksheet.mergeCells(`A${sub2.number}:E${sub2.number}`);

  // helper: ສ້າງແຖວ 2-column (label | value ໂດຍ value merge B:E)
  const addTwoColRow=(label,value,opts={}) => {
    const row=worksheet.addRow([label,value,'','','']);
    worksheet.mergeCells(`B${row.number}:E${row.number}`);
    row.getCell(1).style={...labelStyle,border: borderThin};
    row.getCell(2).style={
      ...(opts.right? valueRightStyle:valueStyle),
      border: borderThin,
      fill: opts.highlight
        ? {type: 'pattern',pattern: 'solid',fgColor: {argb: lightOrange}}
        :opts.bold
          ? {type: 'pattern',pattern: 'solid',fgColor: {argb: gray}}
          :undefined,
      font: (opts.highlight||opts.bold)
        ? {name: 'Noto Sans Lao',size: 10,bold: true}
        :{name: 'Noto Sans Lao',size: 10}
    };
    row.getCell(3).style={border: borderThin};
    row.getCell(4).style={border: borderThin};
    row.getCell(5).style={border: borderThin};
    if(opts.height) row.height=opts.height;
    return row;
  };

  // helper: ສ້າງແຖວ 4-column (label1|value1|label2|value2)
  const addFourColRow=(l1,v1,l2,v2,opts={}) => {
    const row=worksheet.addRow([l1,v1,l2,v2,'']);
    worksheet.mergeCells(`D${row.number}:E${row.number}`);
    row.getCell(1).style={...labelStyle,border: borderThin};
    row.getCell(2).style={
      ...(opts.right1? valueRightStyle:valueStyle),border: borderThin,
      fill: opts.highlight1? {type: 'pattern',pattern: 'solid',fgColor: {argb: lightOrange}}:undefined,
      font: opts.highlight1? {name: 'Noto Sans Lao',size: 10,bold: true}:{name: 'Noto Sans Lao',size: 10}
    };
    row.getCell(3).style={...labelStyle,border: borderThin};
    row.getCell(4).style={
      ...(opts.right2? valueRightStyle:valueStyle),border: borderThin,
      fill: opts.highlight2? {type: 'pattern',pattern: 'solid',fgColor: {argb: lightOrange}}:undefined,
      font: opts.highlight2? {name: 'Noto Sans Lao',size: 10,bold: true}:{name: 'Noto Sans Lao',size: 10}
    };
    row.getCell(5).style={border: borderThin};
    return row;
  };

  const addSectionHeader=(title) => {
    const row=worksheet.addRow([title,'','','','']);
    worksheet.mergeCells(`A${row.number}:E${row.number}`);
    row.getCell(1).style=sectionHeaderStyle;
    row.height=20;
    return row;
  };

  // ===================== SECTION I: KEY SUMMARY =====================
  addSectionHeader('I. ສະຫຼຸບໂດຍຫຍໍ້ຂໍ້ມູນຫຼັກ/Key Summary');

  addTwoColRow('ຊື່ຂອງຜູ້ກູ້ຢືມ/Bor. Name',
    `${borrower.title||''} ${borrower.laoFirstName||''} ${borrower.laoLastName||''}`.trim());
  addTwoColRow('ປະເພດຜູ້ກູ້/Type Bor.','ບຸກຄົນ/Individual');
  addTwoColRow('ປະເພດເງິນກູ້/Type of Loan',loanTypeLabel);
  addTwoColRow('ປະເພດລູກຄ້າ/Type of Customer',
    loan.customerType==='NEW'? 'ລູກຄ້າໃໝ່/ New Cus.':'ລູກຄ້າເກົ່າ/ Existing Cus.');
  addTwoColRow('ຈຸດປະສົງການກູ້ເງິນ/Loan Purpose',loan.loanPurpose||'-');
  addTwoColRow('ຈໍານວນວົງເງິນກູ້/Loan Size',fmtMoney(loan.loanAmountRequested),{right: true});
  addTwoColRow('ຮູບແບບການຊໍາລະ/Repayment Mode',loan.repaymentMode||'Flat rate');
  addTwoColRow('ໄລຍະເວລາ/Term',`${loan.termMonths||0} ເດືອນ`);
  addTwoColRow('ປະຫວັດການຊໍາລະເງິນກູ້/Credit History',
    `ລູກຄ້າເກຣດ ${loan.creditHistoryGrade||'N/A'}/ Grade ${loan.creditHistoryGrade||'N/A'}`);
  addTwoColRow('ອັດຕາດອກເບ້ຍ/Inter. Rate',
    `${loan.interestRatePa||0}% ຕໍ່ປີ/ ${(loan.interestRatePa/12).toFixed(2)}% ຕໍ່ເດືອນ`);
  addTwoColRow('ອັດຕາສ່ວນລາຍຮັບຕໍ່ໜີ້ສິນ/(DSR)',`${assessment.dtiRatio||0}%`,{highlight: true});
  addTwoColRow('ກໍານົດລາຍຮັບຕໍ່ໜີ້ສິນ/DSR Treshold',`${assessment.dtiThreshold||60}%`);
  addTwoColRow('ອັດຕາສ່ວນມູນຄ່າຫຼັກຊັບຕໍ່ວົງເງິນ/(LTV)',assessment.ltvRatio||'N/A');
  addTwoColRow('ກໍານົດມູນຄ່າຫຼັກຊັບຕໍ່ວົງເງິນ/LTV Treshold',`${assessment.ltvThreshold||0}%`);
  addTwoColRow('ງວດຈ່າຍຂອງເງິນກູ້ FINA ທີ່ຂໍປະຈຸບັນ/Install. Amt',
    fmtMoney(assessment.installmentAmount),{right: true});
  addTwoColRow('ຄ່າທໍານຽມເງິນກູ້/Proce. Fees',
    fmtMoney(assessment.processingFeeAmount),{right: true});
  addTwoColRow('ດອກເບ້ຍໄດ້ຮັບທັງໝົດ/Total Inter. Rate Amt',
    fmtMoney(assessment.totalInterest),{right: true});
  addTwoColRow('ຈໍານວນຕົ້ນທຶນ + ດອກເບ້ຍ/Total P+I Amt',
    fmtMoney(assessment.totalPrincipalPlusInterest),{right: true});
  addTwoColRow('ຄ່າທໍານຽມປະເມີນຫຼັກຊັບ/Coll. Fees',
    fmtMoney(loan.collateralFeeAmount||0),{right: true});

  // ===================== SECTION II: BORROWER DATA =====================
  worksheet.addRow([]);
  addSectionHeader('II. ຂໍ້ມູນຜູ້ກູ້/Borrower Data');

  addTwoColRow('ຊື່ ແລະ ນາມສະກຸນຜູ້ກູ້ຫຼັກ/Bor. Name',
    `${borrower.title||''} ${borrower.laoFirstName||''} ${borrower.laoLastName||''}`.trim());
  addTwoColRow('ເອກະສານຢັ້ງຢືນ/Type Certificate',borrower.certificateType||'');
  addTwoColRow('ເລກທີ/Certificate No.',borrower.certificateNo||'');
  addTwoColRow('Age (Year)',borrower.age||'');
  addTwoColRow('ສະຖານະພາບການແຕ່ງງານ/Marital Status',borrower.maritalStatus||'');
  addTwoColRow('ສັນຊາດ/Nationality',borrower.nationality||'');
  addTwoColRow('ລະດັບການສຶກສາ/Education',borrower.education||'');
  addTwoColRow('ອາຊີບ/Occupation',borrower.occupation||'');
  addTwoColRow('ເບີຕິດຕໍ່/Phone No.',borrower.phone||'');
  addTwoColRow('ບ້ານຢູ່ປະຈຸບັນ/Village',borrower.village||'');
  addTwoColRow('ເມືອງ/District',borrower.district?.name||'');
  addTwoColRow('ແຂວງ/Province',borrower.district.province?.name||'');
  addTwoColRow('ຊື່ຮ້ານຄ້າ/Name of Employer',borrower.employerName||'');
  addTwoColRow('ຕໍາແໜ່ງ/Position',borrower.position||'');
  addTwoColRow('ເລກທະບຽນວິສາຫະກິດ/Business Registration Number',borrower.businessRegistrationNumber||'');
  addTwoColRow('ທີ່ຢູ່ບ່ອນເຮັດວຽກ/Village',borrower.companyVillage||'');
  addTwoColRow('ເມືອງ/District',borrower.companyDistrict?.name||'');
  addTwoColRow('ແຂວງ/Province',borrower.companyProvince?.name||'');
  addTwoColRow('ສາຍພົວພັນກັບ FINA/Relationship with FINA',borrower.relationshipWithFina||'NO');
  addTwoColRow('ລາຍຮັບຕໍ່ເດືອນ (ເງິນເດືອນ): Salary',fmtMoney(borrower.monthlySalary),{right: true,bold: true});
  addTwoColRow('ລາຍຈ່າຍຕໍ່ເດືອນ/Household Expense',fmtMoney(borrower.householdExpense),{right: true});

  // ===================== SECTION III: FINANCIAL ANALYSIS =====================
  worksheet.addRow([]);
  addSectionHeader('III. ວິເຄາະການເງິນ/Financial Analysis');

  // ແກ້ evidenceOfIncomeType: ໃຊ້ loan ບໍ່ແມ່ນ borrower
  addFourColRow('ປະເພດຂອງເອກະສານຢັ້ງຢືນລາຍຮັບ/Evidence of Income',loan.evidenceOfIncomeType||'',
    'ລາຍຮັບສຸດທິຈາກເງິນເດືອນ/Net Salary',fmtMoney(borrower.netIncome),{right2: true});
  addFourColRow('ສະກຸນເງິນຄິດໄລ່/Currency','LAK',
    'ລາຍຈ່າຍຄົວເຮືອນ/Household Expense',fmtMoney(borrower.householdExpense),{right2: true});

  // ທຸລະກິດທີ 1
  const bu1=worksheet.addRow(['ຊຸດທີ 1/ 1st Bu','','','','']);
  worksheet.mergeCells(`A${bu1.number}:E${bu1.number}`);
  bu1.getCell(1).style={...subHeaderRowStyle,border: borderThin};

  const biz1=businessIncomes[0]||{};
  addFourColRow('ລາຍໄດ້ຈາກການຂາຍ/Sale Revenue',fmtMoney(biz1.saleRevenue||assessment.totalNetIncome||0),
    'ງວດຈ່າຍເງິນກູ້ FINA ທີ່ຂໍ/Curr Install. to FINA',fmtMoney(assessment.currInstallToFina),{right1: true,right2: true});
  addFourColRow('ຕົ້ນທຶນຂາຍ/Cost of Sale',fmtMoney(biz1.costOfSale||0),
    'ງວດຈ່າຍທີ່ມີຢູ່ກັບ FINA/Exis. Install. to FINA',fmtMoney(assessment.exisInstallToFina||0),{right1: true,right2: true});
  addFourColRow('ກໍາໄລຂັ້ນຕົ້ນ/Gross Profit',fmtMoney(biz1.grossProfit||0),
    'ງວດຈ່າຍໃຫ້ອົງກອນອື່ນ/Pay Install. to Other',fmtMoney(assessment.payInstallToOther),{right1: true,right2: true});
  addFourColRow('ຄ່າໃຊ້ຈ່າຍດໍາເນີນງານ/Oper. Exp.',fmtMoney(biz1.operExpense||0),
    'ລວມງວດຈ່າຍໜີ້ທັງໝົດ/Total Installment',fmtMoney(assessment.totalInstallment),{right1: true,right2: true,highlight2: true});
  addFourColRow('ກໍາໄລສຸດທິ/Net Profit',fmtMoney(biz1.netProfit||0),
    'ລາຍຮັບລວມສຸດທິ(ທຸລະກິດ+ເງິນເດືອນ)/Total net inc',fmtMoney(assessment.totalNetIncome),{right1: true,right2: true});

  // ທຸລະກິດທີ 2
  const bu2=worksheet.addRow(['ຊຸດທີ 2/ 2nd Bu','','','','']);
  worksheet.mergeCells(`A${bu2.number}:E${bu2.number}`);
  bu2.getCell(1).style={...subHeaderRowStyle,border: borderThin};

  const biz2=businessIncomes[1]||{};
  addFourColRow('ລາຍໄດ້ຈາກການຂາຍ/Sale Revenue',fmtMoney(biz2.saleRevenue||0),
    'ລວມລາຍຮັບສຸດທິ(ຫຼັງຫັກ)/Ending Net Income',fmtMoney(assessment.endingNetIncome),{right1: true,right2: true});
  addFourColRow('ຕົ້ນທຶນຂາຍ/Cost of Sale',fmtMoney(biz2.costOfSale||0),
    'ລາຍຮັບຕໍ່ໜີ້ສິນ/(DSR)',`${assessment.dtiRatio||0}%`,{right1: true,highlight2: true});
  addFourColRow('ກໍາໄລຂັ້ນຕົ້ນ/Gross Profit',fmtMoney(biz2.grossProfit||0),
    'ເກນ DSR/DSR Threshold',`${assessment.dtiThreshold||60}%`,{right1: true});
  addFourColRow('ຄ່າໃຊ້ຈ່າຍດໍາເນີນງານ/Oper. Exp.',fmtMoney(biz2.operExpense||0),
    'ມູນຄ່າຫຼັກຊັບຕໍ່ວົງເງິນ/(LTV)',assessment.ltvRatio||'N/A',{right1: true});
  addFourColRow('ກໍາໄລສຸດທິ/Net Profit',fmtMoney(biz2.netProfit||0),
    'ເກນ LTV/LTV Threshold',`${assessment.ltvThreshold||0}%`,{right1: true});

  addFourColRow('ຄ່າໃຊ້ຈ່າຍ/ລາຍໄດ້(Oper. Exp./Sales)',`${assessment.operExpSalesRatio||'0.00'}%`,
    'ຕົ້ນທຶນ/ລາຍໄດ້(COGS/Sales)',`${assessment.cogsSalesRatio||'0.00'}%`);
  addFourColRow('ກໍາໄລຂັ້ນຕົ້ນ/ລາຍໄດ້(GP/Sales)',`${assessment.gpSalesRatio||'0.00'}%`,
    'ລາຍໄດ້ສຸດທິ/ລາຍໄດ້(NP/Sales)',`${assessment.npSalesRatio||'0.00'}%`);

  // ===================== SECTION IV: LOAN DATA =====================
  worksheet.addRow([]);
  addSectionHeader('IV. ຂໍ້ມູນວົງເງິນທີ່ສະເໜີ/Loan Data');

  const loanDetailHdr=worksheet.addRow(['ລາຍລະອຽດເງິນກູ້/Loan Detail','','','','']);
  worksheet.mergeCells(`A${loanDetailHdr.number}:E${loanDetailHdr.number}`);
  loanDetailHdr.getCell(1).style={...subHeaderRowStyle,border: borderThin};

  addTwoColRow('ປະເພດເງິນກູ້/Type of Loan',loanTypeLabel);
  addTwoColRow('ຈໍານວນວົງເງິນກູ້/Loan Size',fmtMoney(loan.loanAmountRequested),{right: true});
  addTwoColRow('ໄລຍະເວລາ/Term',`${loan.termMonths||0} ເດືອນ`);
  addTwoColRow('ອັດຕາດອກເບ້ຍ (ຕໍ່ປີ)/(p.a) Inter. Rate',`${loan.interestRatePa||0}%`);
  addFourColRow('ອັດຕາຄ່າທໍານຽມເງິນກູ້/Proce. Fees',`${loan.processingFeesPercent||0}%`,
    'ອັດຕາຄ່າທໍານຽມປະເມີນ/Coll. Fees',`${loan.collateralFeesPercent||0}%`);
  addFourColRow('ອັດຕາຄ່າທໍານຽມປິດກ່ອນກໍານົດ/Early Settle. Fees',`${loan.earlySettleFeesPercent||0}%`,
    'ຄ່າທໍານຽມອື່ນໆ/Other Fees',`${loan.otherFeesPercent||0}%`);

  // ===================== SECTION V: CONDITIONS =====================
  worksheet.addRow([]);
  addSectionHeader('V. ເງື່ອນໄຂການປ່ອຍເງິນກູ້/Condition and Covenant');

  const condRow1=worksheet.addRow(['1. ເງື່ອນໄຂກ່ອນເຊັນສັນຍາ/Be. Iss. contract','ບໍ່ມີ','','','']);
  worksheet.mergeCells(`B${condRow1.number}:E${condRow1.number}`);
  condRow1.getCell(1).style={...labelStyle,border: borderThin};
  condRow1.getCell(2).style={...valueStyle,border: borderThin};
  condRow1.getCell(3).style={border: borderThin};
  condRow1.getCell(4).style={border: borderThin};
  condRow1.getCell(5).style={border: borderThin};

  const condRow2=worksheet.addRow([
    '2. ເງື່ອນໄຂການເບິກຈ່າຍ/Before Disbursement',
    `1. ສັນຍາກູ້ຢືມຕ້ອງໄດ້ຮັບການລົງນາມ ແລະ ຢັ້ງຢືນຈາກອໍານາດການປົກຄອງບ້ານ. 2. ວົງເງິນອະນຸມັດຈໍານວນ ${fmtMoney(loan.loanAmountRequested)} ກີບ ຈະຖືກໂອນເຂົ້າບັນຊີເງິນຝາກຂອງຜູ້ກູ້ຢືມ ທີ່ເປີດໄວ້ກັບ FINA ແລະ ການເບິກຖອນເງິນກູ້ແມ່ນຈະເຮັດຄັ້ງດຽວ.`,
    '','',''
  ]);
  worksheet.mergeCells(`B${condRow2.number}:E${condRow2.number}`);
  condRow2.getCell(1).style={...labelStyle,border: borderThin,alignment: {horizontal: 'left',vertical: 'top',wrapText: true}};
  condRow2.getCell(2).style={...valueStyle,border: borderThin,alignment: {horizontal: 'left',vertical: 'top',wrapText: true}};
  condRow2.getCell(3).style={border: borderThin};
  condRow2.getCell(4).style={border: borderThin};
  condRow2.getCell(5).style={border: borderThin};
  condRow2.height=60;

  // ===================== SECTION VI: PREPARER / APPROVER =====================
  worksheet.addRow([]);
  addSectionHeader('ຝ່າຍປະເມີນບົດ ແລະ ຜູ້ອະນຸມັດສິນເຊື່ອ / Preparer and Approver');

  // 5 ຄໍລໍາຈິງ: ຕໍາແໜ່ງ, ຊື່, ວັນທີ, ລາຍເຊັນ, ຄໍາເຫັນ (A,B,C,D,E) - ສະເໝີກັນກັບຄວາມກວ້າງລວມຂອງສ່ວນອື່ນທີ່ merge B:E ຫຼື D:E
  const signHeaderRow=worksheet.addRow(['ຕໍາແໜ່ງ/Position','ຊື່/Name','ວັນທີ/Date','ລາຍເຊັນ','ຄໍາເຫັນ']);
  signHeaderRow.eachCell(cell => {
    cell.style={
      font: {name: 'Noto Sans Lao',size: 10,bold: true,color: {argb: white}},
      fill: {type: 'pattern',pattern: 'solid',fgColor: {argb: darkBlue}},
      alignment: {horizontal: 'center',vertical: 'center',wrapText: true},
      border: borderThin
    };
  });

  // ລໍາດັບໃນ PDF: ນາງ ພິລະນາ ດີດີ(?), ນາງ ສຸພະນາ ສີສະພະ, ທ້າວ ດະນະດີພະດີ(CEO), Credit Officer
  // ສ້າງລາຍຊື່ຜູ້ອະນຸມັດ ຕາມ approvalHistory ຕົວຈິງ + Credit Officer ສຸດທ້າຍ
  const approverList=[];

  const verifierApproval=assessment.approvalHistory?.find(h => h.level==='VERIFIER');
  if(verifierApproval) {
    approverList.push({
      position: 'VERIFIER',
      name: verifierApproval.approver?.fullName||'',
      date: verifierApproval.approvedAt,
      comments: verifierApproval.comments||''
    });
  }

  const dcoApproval=assessment.approvalHistory?.find(h => h.level==='DCO');
  if(dcoApproval) {
    approverList.push({
      position: 'DCO',
      name: dcoApproval.approver?.fullName||'',
      date: dcoApproval.approvedAt,
      comments: dcoApproval.comments||''
    });
  }

  const ceoApproval=assessment.approvalHistory?.find(h => h.level==='CEO');
  if(ceoApproval) {
    approverList.push({
      position: 'CEO',
      name: ceoApproval.approver?.fullName||'',
      date: ceoApproval.approvedAt,
      comments: ceoApproval.comments||''
    });
  }

  approverList.push({
    position: 'Credit Officer',
    name: assessment.assessedBy?.fullName||'',
    date: assessment.assessedAt,
    comments: assessment.preparerComments||''
  });

  approverList.forEach(approver => {
    const row=worksheet.addRow([
      approver.position,
      approver.name,
      fmtDateShort(approver.date),
      "",approver.comments
    ]);

    row.getCell(1).style={
      font: {name: 'Noto Sans Lao',size: 10,bold: true},
      fill: {type: 'pattern',pattern: 'solid',fgColor: {argb: lightBlue}},
      alignment: {horizontal: 'left',vertical: 'center',wrapText: true},
      border: borderThin
    };
    row.getCell(2).style={
      font: {name: 'Noto Sans Lao',size: 10},
      alignment: {horizontal: 'left',vertical: 'center',wrapText: true},
      border: borderThin
    };
    row.getCell(3).style={
      font: {name: 'Noto Sans Lao',size: 10},
      alignment: {horizontal: 'center',vertical: 'center',wrapText: true},
      border: borderThin
    };
    row.getCell(4).style={
      font: {name: 'Noto Sans Lao',size: 10},
      alignment: {horizontal: 'left',vertical: 'top',wrapText: true},
      border: borderThin
    };
    row.getCell(5).style={
      font: {name: 'Noto Sans Lao',size: 10},
      alignment: {horizontal: 'left',vertical: 'top',wrapText: true},
      border: borderThin
    };

    row.height=35;
  });

  worksheet.addRow([]);

  // ສ້າງໄຟລ໌ໃຫ້ດາວໂຫຼດ
  const buffer=await workbook.xlsx.writeBuffer();
  const blob=new Blob([buffer],{type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url=window.URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download=`${fileName}-${loan.id}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

export const handlePrintPDF=() => {
  window.print();
};