import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { complaintApi } from '@/db/api';
import type { ReportData } from '@/types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Download, Loader2, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type TimeFilterType = 'daily' | 'weekly' | 'monthly' | 'yearly';

const departmentNames: Record<string, string> = {
  municipal: 'Municipal Department',
  panchayat: 'Panchayat',
  town_panchayat: 'Town Panchayat',
  corporation: 'Corporation',
  water: 'Water Department',
  energy: 'Energy Department',
  pwd: 'Public Works Department',
};

export default function Reports() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('monthly');

  const getDateRange = (filter: TimeFilterType): { startDate: Date; endDate: Date } => {
    const endDate = new Date();
    const startDate = new Date();

    switch (filter) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  };

  const generateReport = async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(timeFilter);

    try {
      const data = await complaintApi.generateReportData(startDate, endDate, profile?.department);
      setReportData(data);
      toast({
        title: 'Report Generated',
        description: 'Analytics data has been compiled successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace: number) => {
      if (currentY + requiredSpace > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
        return true;
      }
      return false;
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Civic Issue Management Report', pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Report Metadata
    const departmentName = profile?.department ? departmentNames[profile.department] : 'All Departments';
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Department: ${departmentName}`, 14, currentY);
    currentY += 7;
    doc.text(`Period: ${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}`, 14, currentY);
    currentY += 7;
    doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, currentY);
    currentY += 7;
    
    // Scope note
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`Note: This report contains data exclusively for ${departmentName}`, 14, currentY);
    currentY += 12;

    // Executive Summary Section
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 14, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryText = `This report provides a comprehensive analysis of civic issues managed by the ${departmentName} during the ${timeFilter} period. The data includes complaint statistics, resolution metrics, and geographical distribution patterns to support data-driven decision making and resource allocation. All metrics and statistics presented in this report are specific to ${departmentName} only and do not include data from other departments.`;
    const summaryLines = doc.splitTextToSize(summaryText, pageWidth - 28);
    doc.text(summaryLines, 14, currentY);
    currentY += summaryLines.length * 5 + 10;

    // Key Performance Indicators Section
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Performance Indicators', 14, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const kpiIntro = 'The following metrics provide an overview of the department\'s performance in handling civic complaints:';
    doc.text(kpiIntro, 14, currentY);
    currentY += 8;

    const kpiData = [
      ['Total Complaints', reportData.total_complaints.toString()],
      ['Solved Issues', reportData.solved_issues.toString()],
      ['Pending Issues', reportData.pending_issues.toString()],
      ['Average Resolution Time', `${reportData.average_resolution_time} hours`],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Metric', 'Value']],
      body: kpiData,
      theme: 'grid',
      headStyles: { 
        fillColor: [30, 58, 138],
        fontSize: 11,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 'auto', halign: 'right' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Performance Analysis
    checkPageBreak(40);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Performance Analysis', 14, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const resolutionRate = reportData.total_complaints > 0 
      ? Math.round((reportData.solved_issues / reportData.total_complaints) * 100)
      : 0;
    const analysisText = `The ${departmentName} achieved a ${resolutionRate}% resolution rate during this period, with ${reportData.solved_issues} out of ${reportData.total_complaints} complaints successfully resolved. The average resolution time of ${reportData.average_resolution_time} hours indicates the efficiency of the complaint handling process within this department. Currently, ${reportData.pending_issues} issues remain pending and require attention. These statistics reflect only the complaints assigned to and handled by ${departmentName}.`;
    const analysisLines = doc.splitTextToSize(analysisText, pageWidth - 28);
    doc.text(analysisLines, 14, currentY);
    currentY += analysisLines.length * 5 + 12;

    // Category Distribution Section
    if (reportData.category_distribution.length > 0) {
      checkPageBreak(60);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Category Distribution', 14, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const categoryIntro = `Complaints handled by ${departmentName} are categorized by type to identify the most common issues and allocate resources effectively within the department:`;
      const categoryIntroLines = doc.splitTextToSize(categoryIntro, pageWidth - 28);
      doc.text(categoryIntroLines, 14, currentY);
      currentY += categoryIntroLines.length * 5 + 3;

      const categoryData = reportData.category_distribution.map((item) => [
        item.category.charAt(0).toUpperCase() + item.category.slice(1),
        item.count.toString(),
        `${Math.round((item.count / reportData.total_complaints) * 100)}%`,
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Count', 'Percentage']],
        body: categoryData,
        theme: 'grid',
        headStyles: { 
          fillColor: [30, 58, 138],
          fontSize: 11,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 10,
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 50, halign: 'right' },
          2: { cellWidth: 50, halign: 'right' },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Location Distribution Section
    if (reportData.location_distribution.length > 0) {
      checkPageBreak(60);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Location Distribution', 14, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const locationIntro = `Geographic distribution of complaints handled by ${departmentName} helps identify areas requiring increased attention and infrastructure improvements within the department's jurisdiction:`;
      const locationIntroLines = doc.splitTextToSize(locationIntro, pageWidth - 28);
      doc.text(locationIntroLines, 14, currentY);
      currentY += locationIntroLines.length * 5 + 3;

      const locationData = reportData.location_distribution.slice(0, 10).map((item) => [
        item.location,
        item.count.toString(),
        `${Math.round((item.count / reportData.total_complaints) * 100)}%`,
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Location', 'Count', 'Percentage']],
        body: locationData,
        theme: 'grid',
        headStyles: { 
          fillColor: [30, 58, 138],
          fontSize: 11,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 10,
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 40, halign: 'right' },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Recommendations Section
    checkPageBreak(50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations', 14, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const recommendations = [
      '1. Focus resources on high-complaint locations to improve response times',
      '2. Analyze category trends to identify recurring issues and implement preventive measures',
      '3. Monitor resolution times to maintain service quality standards',
      '4. Coordinate with other departments for issues requiring inter-departmental collaboration',
      '5. Implement citizen feedback mechanisms to improve service delivery',
    ];
    
    recommendations.forEach((rec) => {
      checkPageBreak(10);
      const recLines = doc.splitTextToSize(rec, pageWidth - 28);
      doc.text(recLines, 14, currentY);
      currentY += recLines.length * 5 + 3;
    });

    currentY += 10;

    // Conclusion Section
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Conclusion', 14, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const conclusionText = `This report demonstrates the ${departmentName}'s commitment to addressing civic issues efficiently. All data, metrics, and analysis presented in this report are specific to ${departmentName} and do not include information from other departments. Continuous monitoring and data-driven decision making will help improve service delivery and citizen satisfaction within the department's scope of responsibility. Regular analysis of these department-specific metrics enables proactive resource allocation and strategic planning for better governance.`;
    const conclusionLines = doc.splitTextToSize(conclusionText, pageWidth - 28);
    doc.text(conclusionLines, 14, currentY);
    currentY += conclusionLines.length * 5 + 15;

    // Footer on last page
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`${departmentName} - Civic Issue Management System - Confidential Report`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`civic-report-${profile?.department || 'all'}-${timeFilter}-${Date.now()}.pdf`);

    toast({
      title: 'PDF Downloaded',
      description: 'Comprehensive report has been downloaded successfully.',
    });
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Report Generation</h2>
        <p className="text-muted-foreground">Generate analytical reports with performance metrics</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select a time period to generate analytics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Time Period</Label>
            <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilterType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generateReport} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      {reportData && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.total_complaints}</div>
                <p className="text-xs text-muted-foreground">Complaints received</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solved Issues</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.solved_issues}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.total_complaints > 0
                    ? `${Math.round((reportData.solved_issues / reportData.total_complaints) * 100)}% resolution rate`
                    : 'No data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Issues</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.pending_issues}</div>
                <p className="text-xs text-muted-foreground">Awaiting resolution</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.average_resolution_time}h</div>
                <p className="text-xs text-muted-foreground">Average time to resolve</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">

            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
                <CardDescription>Complaints by location</CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.location_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.location_distribution.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="location" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Trends</CardTitle>
              <CardDescription>Complaints over time</CardDescription>
            </CardHeader>
            <CardContent>
              {reportData.daily_trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.daily_trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={downloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF Report
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
