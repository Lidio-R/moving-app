import * as XLSX from 'xlsx';

/**
 * 将数据导出为 Excel 并下载
 * @param data 数据数组
 * @param filename 文件名（不含扩展名）
 * @param sheetName 工作表名
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
