// src/utils/loanReportUtils.js
import ExcelJS from 'exceljs';

// ຟັງຊັນຈັດຮູບແບບຕົວເລກເງິນ
export const fmtMoney = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('lo-LA');
};

// ຟັງຊັນຈັດຮູບແບບວັນທີ
export const fmtDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('lo-LA', { dateStyle: 'medium', timeStyle: 'short' });
};

// ຟັງຊັນຈັດຮູບແບບວັນທີແບບສັ້ນ (ສະເພາະວັນທີ)
export const fmtDateShort = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('lo-LA');
};

// ==========================================
// 1. ຟັງຊັນ EXPORT EXCEL (ຮູບແບບຕາມ PDF ເປະ)
// ==========================================
export const exportToExcel = async (reportData, fileName = 'loan-report') => {
  if (!reportData || !reportData.data) return;

  const { data: loan } = reportData;
  const borrower = loan.borrower || {};
  const assessment = loan.assessment || {};

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Loan Assessment Report');

  // ກຳນົດຄວາມກວ້າງຂອງ Column ໃຫ້ເໝາະສົມກັບຟອມ
  worksheet.columns = [
    { width: 70 }, // A
    { width: 70 }, // B
    { width: 70 }, // C
    { width: 70 }, // D
  ];

  // Colors
  const darkBlue = 'FF1F4E78';
  const lightBlue = 'FFD9E1F2';
  const lightOrange = 'FFFED8B1';
  const white = 'FFFFFFFF';
  const gray = 'FFF0F0F0';

  // Styles ເຮັດວຽກຮ່ວມກັນ
  const titleStyle = {
    font: { name: 'Noto Sans Lao', size: 16, bold: true, color: { argb: white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: darkBlue } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
  };

  const sectionHeaderStyle = {
    font: { name: 'Noto Sans Lao', size: 11, bold: true, color: { argb: white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: darkBlue } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true }
  };

  const labelStyle = {
    font: { name: 'Noto Sans Lao', size: 10, bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: lightBlue } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true }
  };

  const valueStyle = {
    font: { name: 'Noto Sans Lao', size: 10 },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true }
  };

  const valueLabelStyle = {
    font: { name: 'Noto Sans Lao', size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: gray } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true }
  };

  const orangeHighlightStyle = {
    font: { name: 'Noto Sans Lao', size: 10, bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: lightOrange } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true }
  };

  const borderThin = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  };

  // --- PAGE 1: HEADER ---
  const titleRow = worksheet.addRow(['ແບບຟອມການປະເມີນເງິນກູ້ / Loan Assessment Tool']);
  titleRow.height = 25;
  const titleCell = titleRow.getCell(1);
  titleCell.style = titleStyle;
  worksheet.mergeCells('A1:D1');

  // Row ສະກາວ
  worksheet.addRow(['']);
  worksheet.addRow(['ຜູ້ກູ້ລາຍດຽວ', 'ເລກທີ່ຜູ້ກູ້']);

  // --- SECTION 1: KEY SUMMARY ---
  const s1Row = worksheet.addRow([]);
  worksheet.mergeCells(`A${s1Row.number}:D${s1Row.number}`);
  s1Row.getCell(1).value = 'I. ສະຫຼຸບໂດຍຫຍໍ້ຂໍ້ມູນຫຼັກ / Key Summary';
  s1Row.getCell(1).style = sectionHeaderStyle;
  s1Row.height = 20;

  const summaryData = [
    [
      { label: 'ຊື່ຜູ້ກູ້ຢືມ / Bor. Name', value: `${borrower.laoFirstName || ''}${borrower.laoFirstName && borrower.laoLastName ? ' ' : ''}${borrower.laoLastName || ''}` },
      { label: 'ປະຫວັດການຊຳລະເງິນ / Credit History', value: loan.creditHistoryGrade || 'N/A' }
    ],
    [
      { label: 'ປະເພດຜູ້ກູ້ຢືມ / Type Bor', value: 'ບຸກຄົນ / Individual' },
      { label: 'ອັດຕາດອກເບ້ຍ / Inter. Rate', value: `${loan.interestRatePa || 0}% ຕໍ່ປີ / 1.65% ຕໍ່ເດືອນ` }
    ],
    [
      { label: 'ປະເພດເງິນກູ້ / Type of Loan', value: 'ເງິນກູ້ສ່ວນບຸກຄົນແບບບໍ່ມີຫຼັກຊັບ / (Salary Guarantee)' },
      { label: 'ອັດຕາສ່ວນລາຍຮັບຕໍ່ໜີ້ສິນ / (DSR)', value: `${assessment.dtiRatio || 0}%`, highlight: true }
    ],
    [
      { label: 'ປະເພດລູກຄ້າ / Type of Customer', value: loan.customerType === 'NEW' ? 'ລູກຄ້າໃໝ່ / New Cus.' : 'ລູກຄ້າເກົ່າ' },
      { label: 'ກໍານົດລາຍຮັບຕໍ່ໜີ້ສິນ / DSR Threshold', value: `${assessment.dtiThreshold || 60}%`, highlight: true }
    ],
    [
      { label: 'ຈຸດປະສົງການກູ້ເງິນ / Loan Purpose', value: loan.loanPurpose || '-' },
      { label: 'ອັດຕາສ່ວນມູນຄ່າຫຼັກຊັບຕໍ່ວົງເງິນ / (LTV)', value: 'N/A' }
    ],
    [
      { label: 'ຈໍານວນວົງເງິນກູ້ / Loan Size', value: `${fmtMoney(loan.loanAmountRequested)} LAK`, bold: true },
      { label: 'ກໍານົດມູນຄ່າຫຼັກຊັບຕໍ່ວົງເງິນ / LTV Threshold', value: '0%' }
    ],
    [
      { label: 'ຮູບແບບການສໍາລະ / Repayment Mode', value: loan.repaymentMode || 'Flat rate' },
      { label: 'ງວດຈ່າຍຂອງເງິນກູ້ FINA ທີ່ຂໍປັດຈຸບັນ / Install. Amt', value: `${fmtMoney(assessment.installmentAmount)} LAK`, bold: true }
    ],
    [
      { label: 'ໄລຍະເວລາ / Term', value: `${loan.termMonths || 0} ເດືອນ` },
      { label: 'ຄ່າທໍານຽມເງິນກູ້ / Proce. Fees', value: `${fmtMoney(assessment.processingFeeAmount || 0)} LAK` }
    ]
  ];

  summaryData.forEach(rowData => {
    const row = worksheet.addRow([
      rowData[0].label,
      rowData[0].value,
      rowData[1].label,
      rowData[1].value
    ]);
    
    // Cell A - Label
    const cellA = row.getCell(1);
    cellA.style = { ...labelStyle, border: borderThin };
    
    // Cell B - Value
    const cellB = row.getCell(2);
    cellB.style = {
      ...valueStyle,
      border: borderThin,
      fill: rowData[0].bold ? { type: 'pattern', pattern: 'solid', fgColor: { argb: gray } } : undefined
    };
    if (rowData[0].bold) cellB.font = { name: 'Noto Sans Lao', size: 10, bold: true };
    
    // Cell C - Label
    const cellC = row.getCell(3);
    cellC.style = { ...labelStyle, border: borderThin };
    
    // Cell D - Value
    const cellD = row.getCell(4);
    cellD.style = {
      ...valueStyle,
      border: borderThin,
      fill: rowData[1].highlight ? { type: 'pattern', pattern: 'solid', fgColor: { argb: lightOrange } } : undefined
    };
    if (rowData[1].highlight) cellD.font = { name: 'Noto Sans Lao', size: 10, bold: true };
  });

  // --- SECTION 2: BORROWER DATA ---
  worksheet.addRow([]);
  const s2Row = worksheet.addRow([]);
  worksheet.mergeCells(`A${s2Row.number}:D${s2Row.number}`);
  s2Row.getCell(1).value = 'II. ຂໍ້ມູນຜູ້ກູ້ / Borrower Data';
  s2Row.getCell(1).style = sectionHeaderStyle;
  s2Row.height = 20;

  const borrowerData = [
    [
      { label: 'ຊື່ ແລະ ນາມສະກຸນຜູ້ກູ້ຫຼັກ / Bor. Name', value: `${borrower.laoFirstName || ''} ${borrower.laoLastName || ''}` },
      { label: 'ເມືອງ / District', value: 'ເມືອງໄຊທານີ' }
    ],
    [
      { label: 'ເອກະສານຢັ້ງຢືນ / Type Certificate', value: borrower.certificateType || 'FAMILY BOOK' },
      { label: 'ແຂວງ / Province', value: 'ນະຄອນຫຼວງວຽງຈັນ' }
    ],
    [
      { label: 'ເລກທີ / Certificate No.', value: borrower.certificateNo || '' },
      { label: 'ຮ້ານຄ້າ / Name of Employer', value: borrower.employerName || '' }
    ],
    [
      { label: 'Age (Year)', value: borrower.age || '' },
      { label: 'ຕໍາແໜ່ງ / Position', value: borrower.position || '' }
    ],
    [
      { label: 'ສະຖານະພາບການແຕ່ງງານ / Marital Status', value: borrower.maritalStatus || 'Single' },
      { label: 'ເລກທະບຽນວິສາຫະກິດ / Business Reg No.', value: borrower.businessRegistrationNumber || 'N/A' }
    ],
    [
      { label: 'ສັນຊາດ / Nationality', value: borrower.nationality || 'Lao' },
      { label: 'ຢູ່ບ່ອນເຮັດວຽກ / Village', value: borrower.companyVillage || '' }
    ],
    [
      { label: 'ລະດັບການສຶກສາ / Education', value: borrower.education || '' },
      { label: 'ເມືອງ / District', value: 'ເມືອງອຸທຸມພອນ' }
    ],
    [
      { label: 'ອາຊີບ / Occupation', value: borrower.occupation || '' },
      { label: 'ແຂວງ / Province', value: 'ສະຫວັນນະເຂດ' }
    ],
    [
      { label: 'Phone No.', value: borrower.phone || '' },
      { label: 'ສາຍພົວພັນກັບ FINA / Relationship with FINA', value: borrower.relationshipWithFina || 'NO' }
    ],
    [
      { label: 'ບ້ານຢູ່ປະຈຸບັນ / Village', value: borrower.village || '' },
      { label: 'ລາຍຮັບຕໍ່ເດືອນ (ເງິນເດືອນ) / Salary', value: `${fmtMoney(borrower.monthlySalary)} LAK`, bold: true }
    ]
  ];

  borrowerData.forEach(rowData => {
    const row = worksheet.addRow([
      rowData[0].label,
      rowData[0].value,
      rowData[1].label,
      rowData[1].value
    ]);
    
    row.getCell(1).style = { ...labelStyle, border: borderThin };
    row.getCell(2).style = {
      ...valueStyle,
      border: borderThin,
      fill: rowData[0].bold ? { type: 'pattern', pattern: 'solid', fgColor: { argb: gray } } : undefined
    };
    if (rowData[0].bold) row.getCell(2).font = { name: 'Noto Sans Lao', size: 10, bold: true };
    
    row.getCell(3).style = { ...labelStyle, border: borderThin };
    row.getCell(4).style = {
      ...valueStyle,
      border: borderThin,
      fill: rowData[1].bold ? { type: 'pattern', pattern: 'solid', fgColor: { argb: gray } } : undefined
    };
    if (rowData[1].bold) row.getCell(4).font = { name: 'Noto Sans Lao', size: 10, bold: true };
  });

  // --- SECTION 3: FINANCIAL ANALYSIS ---
  worksheet.addRow([]);
  const s3Row = worksheet.addRow([]);
  worksheet.mergeCells(`A${s3Row.number}:D${s3Row.number}`);
  s3Row.getCell(1).value = 'III. ວິເຄາະການເງິນ / Financial Analysis';
  s3Row.getCell(1).style = sectionHeaderStyle;
  s3Row.height = 20;

  const financialData = [
    [
      { label: 'ປະເພດຂອງເອກະສານຢັ້ງຢືນລາຍຮັບ / Evidence of Income', value: borrower.evidenceOfIncomeType || 'BANK_STATEMENT' },
      { label: 'ລາຍຮັບສຸດທິຈາກເງິນເດືອນ / Net Salary', value: `${fmtMoney(borrower.netIncome)} LAK`, bold: true }
    ],
    [
      { label: 'ສະກຸນເງິນຄໍານວນ / Currency', value: 'LAK' },
      { label: 'ລາຍຈ່າຍຄົວເຮືອນ / Household Expense', value: `${fmtMoney(borrower.householdExpense)} LAK` }
    ],
    [
      { label: 'ລາຍໄດ້ຈາກການຂາຍ / Sale Revenue', value: `${fmtMoney(assessment.totalNetIncome)} LAK` },
      { label: 'ງວດຈ່າຍເງິນກູ້ FINA ທີ່ຂໍປັດຈຸບັນ / Curr Install. to FINA', value: `${fmtMoney(assessment.currInstallToFina)} LAK`, bold: true }
    ],
    [
      { label: 'ຕົ້ນທຶນຂາຍ / Cost of Sale', value: `${fmtMoney(assessment.totalInstallment)} LAK` },
      { label: 'ງວດຈ່າຍທີ່ຢູ່ຕໍ່ FINA / Exis. Install. to FINA', value: `${fmtMoney(assessment.exisInstallToFina || 0)} LAK` }
    ],
    [
      { label: 'ກຳໄລຂັ້ນຕົ້ນ / Gross Profit', value: `${fmtMoney(assessment.totalNetIncome)} LAK` },
      { label: 'ງວດຈ່າຍໃຫ້ອົງກອນອື່ນ / Pay Install. to Other', value: `${fmtMoney(assessment.payInstallToOther)} LAK` }
    ],
    [
      { label: 'ຄ່າໃຊ້ຈ່າຍດຳເນີນງານ / Oper. Exp.', value: `${fmtMoney(assessment.totalInstallment)} LAK` },
      { label: 'ລວມງວດຈ່າຍໜີ້ທັງໝົດ / Total Installment', value: `${fmtMoney(assessment.totalInstallment)} LAK`, bold: true }
    ],
    [
      { label: 'ກຳໄລສຸດທິ / Net Profit', value: `${fmtMoney(assessment.endingNetIncome)} LAK` },
      { label: 'ລາຍຮັບລວມສຸດທິ (ທຸລະກິດ + ເງິນເດືອນ) / Total net inc', value: `${fmtMoney(assessment.totalNetIncome)} LAK` }
    ],
    [
      { label: 'ລາຍໄດ້ຈາກການຂາຍ / Sale Revenue', value: `${fmtMoney(0)} LAK` },
      { label: 'ລວມລາຍຮັບສຸດທິ (ຫຼັງຫັກ) / Ending Net Income', value: `${fmtMoney(assessment.endingNetIncome)} LAK` }
    ],
    [
      { label: 'ຕົ້ນທຶນຂາຍ / Cost of Sale', value: `${fmtMoney(0)} LAK` },
      { label: 'ລາຍຮັບຕໍ່ໜີ້ສິນ / (DSR)', value: `${assessment.dtiRatio || 0}%`, highlight: true }
    ],
    [
      { label: 'ກຳໄລຂັ້ນຕົ້ນ / Gross Profit', value: `${fmtMoney(0)} LAK` },
      { label: 'ເກນ DSR / DSR Threshold', value: `${assessment.dtiThreshold || 60}%`, highlight: true }
    ],
    [
      { label: 'ຄ່າໃຊ້ຈ່າຍ / ລາຍໄດ້ (Oper. Exp./Sales)', value: '0.00%' },
      { label: 'ມູນຄ່າຫຼັກຊັບຕໍ່ວົງເງິນ / (LTV)', value: 'N/A' }
    ],
    [
      { label: 'ກຳໄລຂັ້ນຕົ້ນ / ລາຍໄດ້ (GP/Sales)', value: '30.00%' },
      { label: 'ເກນ LTV / LTV Threshold', value: '0%' }
    ]
  ];

  financialData.forEach(rowData => {
    const row = worksheet.addRow([
      rowData[0].label,
      rowData[0].value,
      rowData[1].label,
      rowData[1].value
    ]);
    
    row.getCell(1).style = { ...labelStyle, border: borderThin };
    row.getCell(2).style = {
      ...valueStyle,
      border: borderThin,
      fill: rowData[0].bold ? { type: 'pattern', pattern: 'solid', fgColor: { argb: gray } } : undefined
    };
    if (rowData[0].bold) row.getCell(2).font = { name: 'Noto Sans Lao', size: 10, bold: true };
    
    row.getCell(3).style = { ...labelStyle, border: borderThin };
    row.getCell(4).style = {
      ...valueStyle,
      border: borderThin,
      fill: rowData[1].highlight ? { type: 'pattern', pattern: 'solid', fgColor: { argb: lightOrange } } 
            : rowData[1].bold ? { type: 'pattern', pattern: 'solid', fgColor: { argb: gray } }
            : undefined
    };
    if (rowData[1].highlight) row.getCell(4).font = { name: 'Noto Sans Lao', size: 10, bold: true };
    if (rowData[1].bold && !rowData[1].highlight) row.getCell(4).font = { name: 'Noto Sans Lao', size: 10, bold: true };
  });

  // --- SECTION 4: LOAN DATA ---
  worksheet.addRow([]);
  const s4Row = worksheet.addRow([]);
  worksheet.mergeCells(`A${s4Row.number}:D${s4Row.number}`);
  s4Row.getCell(1).value = 'IV. ບົດລາຍງານເງິນກູ້ / Loan Data';
  s4Row.getCell(1).style = sectionHeaderStyle;
  s4Row.height = 20;

  const loanDetailRow1 = worksheet.addRow([
    'ປະເພດເງິນກູ້ / Type of Loan',
    'ເງິນກູ້ສ່ວນບຸກຄົນແບບບໍ່ມີຫຼັກຊັບ / (Salary Guarantee)',
    'ອັດຕາທໍານຽມປະເມີນ / Coll. Fees',
    '0%'
  ]);
  loanDetailRow1.eachCell((cell, num) => {
    if (num === 1 || num === 3) cell.style = { ...labelStyle, border: borderThin };
    else cell.style = { ...valueStyle, border: borderThin };
  });

  const loanDetailRow2 = worksheet.addRow([
    'ຈໍານວນວົງເງິນກູ້ / Loan Size',
    `${fmtMoney(loan.loanAmountRequested)} LAK`,
    'ອັດຕາທໍານຽມອື່ນ / Other Fees',
    '0%'
  ]);
  loanDetailRow2.eachCell((cell, num) => {
    if (num === 1 || num === 3) cell.style = { ...labelStyle, border: borderThin };
    else {
      cell.style = { ...valueStyle, border: borderThin, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: gray } } };
      cell.font = { name: 'Noto Sans Lao', size: 10, bold: true };
    }
  });

  const loanDetailRow3 = worksheet.addRow([
    'ໄລຍະເວລາ / Term',
    `${loan.termMonths || 0} ເດືອນ`,
    '',
    ''
  ]);
  loanDetailRow3.eachCell((cell, num) => {
    if (num === 1) cell.style = { ...labelStyle, border: borderThin };
    else if (num === 2) cell.style = { ...valueStyle, border: borderThin };
  });

  const loanDetailRow4 = worksheet.addRow([
    'ອັດຕາດອກເບ້ຍ (ຕໍ່ປີ) / p.a) Inter. Rate',
    `${loan.interestRatePa}%`,
    '',
    ''
  ]);
  loanDetailRow4.eachCell((cell, num) => {
    if (num === 1) cell.style = { ...labelStyle, border: borderThin };
    else if (num === 2) cell.style = { ...valueStyle, border: borderThin };
  });

  const loanDetailRow5 = worksheet.addRow([
    'ອັດຕາຄ່າທໍານຽມເງິນກູ້ / Proce. Fees',
    `${loan.processingFeesPercent || 0}%`,
    'ອັດຕາທໍານຽມເງິນກູ້ / Coll. Fees',
    `${loan.collateralFeesPercent || 0}%`
  ]);
  loanDetailRow5.eachCell((cell, num) => {
    if (num === 1 || num === 3) cell.style = { ...labelStyle, border: borderThin };
    else cell.style = { ...valueStyle, border: borderThin };
  });

  // Add fee summary row before conditions
  const feeRow = worksheet.addRow([
    'ອັດຕາທໍານຽມອື່ນປັດກາວໃກ້ສະ / Early Settle. Fees',
    `${loan.earlySettleFeesPercent || 0}%`,
    'ຄ່າທໍານຽມອື່ນໆ / Other Fees',
    `${loan.otherFeesPercent || 0}%`
  ]);
  feeRow.eachCell((cell, num) => {
    if (num === 1 || num === 3) {
      cell.style = { ...labelStyle, border: borderThin };
    } else {
      cell.style = { ...valueStyle, border: borderThin };
    }
  });

  // Add additional summary rows after fees
  const summaryRow1 = worksheet.addRow([
    'ດອກເບ້ຍໄດ້ຮັບທັງໝົດ / Total Inter. Rate Amt',
    `${fmtMoney(assessment.totalInterest || 0)} LAK`,
    'ຕົ້ນທຶນ + ດອກເບ້ຍລວມ / Total P+I Amt',
    `${fmtMoney(assessment.totalPrincipalPlusInterest || 0)} LAK`
  ]);
  summaryRow1.eachCell((cell, num) => {
    if (num === 1 || num === 3) cell.style = { ...labelStyle, border: borderThin };
    else cell.style = { ...valueStyle, border: borderThin };
  });

  const summaryRow2 = worksheet.addRow([
    'ອັດຕາທໍານຽມໃຫ້ຕົ້ນ / Monthly Principal',
    `${fmtMoney(assessment.monthlyPrincipal || 0)} LAK`,
    'ອັດຕາດອກເບ້ຍລາຍເດືອນ / Monthly Interest',
    `${fmtMoney(assessment.monthlyInterest || 0)} LAK`
  ]);
  summaryRow2.eachCell((cell, num) => {
    if (num === 1 || num === 3) cell.style = { ...labelStyle, border: borderThin };
    else cell.style = { ...valueStyle, border: borderThin };
  });

  // --- SECTION 5: CONDITIONS AND COVENANTS ---
  worksheet.addRow([]);
  const s5Row = worksheet.addRow([]);
  worksheet.mergeCells(`A${s5Row.number}:D${s5Row.number}`);
  s5Row.getCell(1).value = 'V. ເງື່ອນໄຂການປ່ອຍເງິນກູ້ / Condition and Covenant';
  s5Row.getCell(1).style = sectionHeaderStyle;
  s5Row.height = 20;

  // Condition 1
  const condRow1 = worksheet.addRow([
    '1. ເງື່ອນໄຂກ່ອນເຊັນສັນຍາ / Be. Iss. contract',
    'ບໍ່ມີ'
  ]);
  condRow1.getCell(1).style = { ...labelStyle, border: borderThin };
  condRow1.getCell(2).style = { ...valueStyle, border: borderThin };
  condRow1.height = 20;

  // Condition 2
  const condRow2 = worksheet.addRow([
    '2. ເງື່ອນໄຂການເບິກຈ່າຍ / Before Disbursement',
    `1. ສັນຍາກູ້ຢືມຕ້ອງໄດ້ຮັບການລົງນາມ ແລະ ຢັ້ງຢືນຈາກອໍານາດການປົກຄອງບ້ານ. 2. ວົງເງິນອະນຸມັດຈໍານວນ ${fmtMoney(loan.loanAmountRequested)} ກີບ ຈະຖືກໂອນເຂົ້າບັນຊີເງິນຝາກຂອງຜູ້ກູ້ຢືມ ທີ່ເປີດໄວ້ກັບ FINA ແລະ ການເບິກຖອນເງິນກູ້ແມ່ນຈະເຮັດຄັ້ງດຽວ.`
  ]);
  condRow2.getCell(1).style = { ...labelStyle, border: borderThin };
  condRow2.getCell(2).style = { ...valueStyle, border: borderThin, wrapText: true, alignment: { horizontal: 'left', vertical: 'top', wrapText: true } };
  condRow2.height = 50;

  // --- SECTION 6: PREPARER AND APPROVER ---
  worksheet.addRow([]);
  const s6Row = worksheet.addRow([]);
  worksheet.mergeCells(`A${s6Row.number}:D${s6Row.number}`);
  s6Row.getCell(1).value = 'ຝ່າຍປະເມີນບົດ ແລະ ຜູ້ອະນຸມັດສິນເຊື່ອ / Preparer and Approver';
  s6Row.getCell(1).style = sectionHeaderStyle;
  s6Row.height = 20;

  // Header row for signatures with 5 columns
  const signHeaderRow = worksheet.addRow([
    'ຕໍາແໜ່ງ / Position',
    'ຊື່ / Name',
    'ວັນທີ / Date',
    'ລາຍເຊັນ / Signature'
  ]);
  signHeaderRow.eachCell(cell => {
    cell.style = {
      font: { name: 'Noto Sans Lao', size: 10, bold: true, color: { argb: white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: darkBlue } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: borderThin
    };
  });

  // Build approver list with proper data from approval history
  const approverList = [];
  
  // 1. CEO - from approval history
  const ceoApproval = assessment.approvalHistory?.find(h => h.level === 'CEO');
  if (ceoApproval || assessment.ceoId) {
    approverList.push({
      position: 'CEO',
      name: ceoApproval?.approver?.fullName || assessment.ceo?.fullName || '',
      date: ceoApproval?.approvedAt || '',
      comments: ceoApproval?.comments || ''
    });
  }

  // 2. DCO - from approval history
  const dcoApproval = assessment.approvalHistory?.find(h => h.level === 'DCO');
  if (dcoApproval || assessment.dcoId) {
    approverList.push({
      position: 'DCO',
      name: dcoApproval?.approver?.fullName || assessment.dco?.fullName || '',
      date: dcoApproval?.approvedAt || '',
      comments: dcoApproval?.comments || ''
    });
  }

  // 3. Credit Operations Executive - from assessment
  approverList.push({
    position: 'Credit Operations Executive',
    name: assessment.assessedBy?.fullName || '',
    date: assessment.assessedAt || '',
    comments: assessment.preparerComments || ''
  });

  // 4. Credit Officer (Preparer)
  const creditOfficerApproval = assessment.approvalHistory?.find(h => h.level === 'CREDIT_OFFICER');
  if (creditOfficerApproval || assessment.assessedById) {
    approverList.push({
      position: 'Credit Officer',
      name: assessment.assessedBy?.fullName || '',
      date: assessment.assessedAt || '',
      comments: 'Created by CREDIT_OFFICER - Pending further review'
    });
  }

  // Display each approver
  approverList.forEach(approver => {
    const row = worksheet.addRow([
      approver.position,
      approver.name,
      fmtDateShort(approver.date),
      'ລາຍເຊັນ'
    ]);
    
    // Position cell - blue background
    const posCell = row.getCell(1);
    posCell.style = {
      font: { name: 'Noto Sans Lao', size: 10, bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: lightBlue } },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: borderThin
    };
    
    // Name cell
    const nameCell = row.getCell(2);
    nameCell.style = {
      font: { name: 'Noto Sans Lao', size: 10 },
      alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
      border: borderThin
    };
    
    // Date cell
    const dateCell = row.getCell(3);
    dateCell.style = {
      font: { name: 'Noto Sans Lao', size: 10 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: borderThin
    };
    
    // Signature cell - blue background
    const sigCell = row.getCell(4);
    sigCell.style = {
      font: { name: 'Noto Sans Lao', size: 10 },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: borderThin,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: lightBlue } }
    };
    
    row.height = 25;

    // Add comments row if comments exist
    if (approver.comments && approver.comments.trim() !== '') {
      const commentRow = worksheet.addRow([
        'ຄຳເຫັນ / Comments:',
        approver.comments,
        '',
        ''
      ]);
      
      commentRow.getCell(1).style = {
        font: { name: 'Noto Sans Lao', size: 9, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
        border: borderThin
      };
      
      commentRow.getCell(2).style = {
        font: { name: 'Noto Sans Lao', size: 9 },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
        border: borderThin,
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFAFA' } }
      };
      
      commentRow.getCell(3).style = { border: borderThin };
      commentRow.getCell(4).style = { border: borderThin };
      
      commentRow.height = 35;
    }
  });

  // Add bottom border
  worksheet.addRow([]);

  // ສ້າງໄຟລ໌ໃຫ້ດາວໂຫຼດ
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileName}-${loan.id}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};


export const handlePrintPDF = () => {
  window.print();
};