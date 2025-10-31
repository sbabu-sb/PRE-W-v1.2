import { useState, useCallback } from 'react';
import { WorklistPatient, JourneyEvent, JourneyGap, JourneyPersona } from '../../../types';
import { appConfig } from '../../../constants';
import { formatDate, formatRelativeTime } from '../../../utils/formatters';

// Since we are loading from CDN, we need to declare the window properties
declare global {
    interface Window {
        jspdf: any;
        jsPDF: any; 
    }
}

interface PdfGeneratorProps {
    patient: WorklistPatient;
    journeyData: {
        events: JourneyEvent[];
        gaps: JourneyGap[];
        summary: { duration: string; denials: number; conformanceScore: number };
    };
    persona: JourneyPersona;
}

export const useJourneyPdfGenerator = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePDF = useCallback(async ({ patient, journeyData, persona }: PdfGeneratorProps) => {
        setIsGenerating(true);
        try {
            const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
            if (!jsPDF) {
                throw new Error('jsPDF library not loaded.');
            }
            const doc = new jsPDF();
            if (typeof (doc as any).autoTable !== 'function') {
                throw new Error('jsPDF-autotable plugin not loaded.');
            }

            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            let yPos = 0;
            const MARGIN = 15;

            // --- HEADER ---
            doc.setFillColor('#1E3A8A'); // Dark Blue
            doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#FFFFFF');
            doc.text(appConfig.brandName, MARGIN, 16);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text('Patient Journey Report', pageWidth - MARGIN, 16, { align: 'right' });
            yPos = 35;

            // --- PATIENT/CASE INFO ---
            doc.setFontSize(10);
            doc.setTextColor('#374151'); // Gray-700
            (doc as any).autoTable({
                startY: yPos,
                theme: 'plain',
                body: [
                    [
                        { content: `Patient: ${patient.metaData.patient.name}`, styles: { fontStyle: 'bold' } },
                        { content: `Case ID: ${patient.id}`, styles: { halign: 'right' } }
                    ],
                    [
                        `DOB: ${formatDate(patient.metaData.patient.dob)}`,
                        { content: `DOS: ${formatDate(patient.metaData.service.date)}`, styles: { halign: 'right' } }
                    ],
                    [
                       `Payer: ${patient.payers[0]?.insurance.name || 'N/A'}`,
                       { content: `Generated On: ${new Date().toLocaleDateString()}`, styles: { halign: 'right' } }
                    ]
                ],
                styles: { fontSize: 9 }
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
            
            // --- SUMMARY METRICS ---
            (doc as any).autoTable({
                startY: yPos,
                theme: 'grid',
                head: [['Journey Duration', 'Auth Denials', 'Conformance Score']],
                body: [[journeyData.summary.duration, journeyData.summary.denials, `${journeyData.summary.conformanceScore}%`]],
                headStyles: { fillColor: '#4B5563' }, // Gray-600
                styles: { fontSize: 10, halign: 'center' }
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
            
            // --- JOURNEY TIMELINE ---
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#1F2937'); // Gray-800
            doc.text('Journey Timeline', MARGIN, yPos);
            yPos += 8;

            const timelineBody = [...journeyData.events, ...journeyData.gaps]
              .sort((a,b) => {
                  const timeA = new Date('startTimestamp' in a ? a.startTimestamp : a.timestamp).getTime();
                  const timeB = new Date('startTimestamp' in b ? b.startTimestamp : b.timestamp).getTime();
                  return timeA - timeB; // Oldest first for PDF
              })
              .map(item => {
                  if (item.type === 'journey_gap') {
                      return [
                        formatDate(item.startTimestamp.split('T')[0]),
                        'JOURNEY GAP',
                        `${item.description} (${item.durationHours} hours)`
                      ];
                  }
                  const event = item as JourneyEvent;
                  return [
                    formatDate(event.timestamp.split('T')[0]),
                    event.phase.replace('_', ' ').toUpperCase(),
                    event.description
                  ];
              });
              
            (doc as any).autoTable({
                startY: yPos,
                head: [['Date', 'Phase', 'Description']],
                body: timelineBody,
                theme: 'striped',
                headStyles: { fillColor: '#4B5563' },
                styles: { fontSize: 9 },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 35, fontStyle: 'bold' }
                },
                didDrawCell: (data: any) => {
                    if (data.cell.section === 'body' && data.row.raw[1] === 'JOURNEY GAP') {
                        doc.setFillColor('#FEF9C3'); // Yellow-100
                    }
                }
            });

            // --- FOOTER ---
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor('#6B7280'); // Gray-500
                doc.text(`Page ${i} of ${pageCount}`, pageWidth - MARGIN, pageHeight - 10, { align: 'right' });
                doc.text(`CONFIDENTIAL - FOR ${persona.toUpperCase()} VIEW`, MARGIN, pageHeight - 10);
            }

            doc.save(`PatientJourney_${patient.metaData.patient.name.replace(/ /g, '_')}_${patient.id}.pdf`);

        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert(`An error occurred while generating the PDF: ${error}`);
        }
        setIsGenerating(false);
    }, []);

    return { generatePDF, isGenerating };
};
