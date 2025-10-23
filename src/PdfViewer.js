import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// ตั้งค่า worker สำหรับ react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PdfViewer = ({ pdfUrl, title, onClose, originalUrl }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setLoading(false);
        setError(null);
    };

    const onDocumentLoadError = (error) => {
        console.error('Error loading PDF:', error);
        setError('ไม่สามารถโหลด PDF ได้ เนื่องจากปัญหา CORS');
        setLoading(false);
    };

    const openInNewTab = () => {
        window.open(originalUrl || pdfUrl, '_blank');
        onClose();
    };

    const goToPrevPage = () => {
        setPageNumber(prev => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setPageNumber(prev => Math.min(prev + 1, numPages));
    };

    const zoomIn = () => {
        setScale(prev => Math.min(prev + 0.2, 3.0));
    };

    const zoomOut = () => {
        setScale(prev => Math.max(prev - 0.2, 0.5));
    };

    const resetZoom = () => {
        setScale(1.0);
    };

    return (
        <div className="pdf-viewer">
            <div className="pdf-viewer-header">
                <div className="pdf-viewer-title">{title}</div>

                <div className="pdf-viewer-controls">
                    {numPages && (
                        <div className="page-controls">
                            <button className="pdf-viewer-btn" onClick={goToPrevPage} disabled={pageNumber <= 1}>
                                ←
                            </button>
                            <span className="page-info">
                                {pageNumber} / {numPages}
                            </span>
                            <button className="pdf-viewer-btn" onClick={goToNextPage} disabled={pageNumber >= numPages}>
                                →
                            </button>
                        </div>
                    )}

                    <div className="zoom-controls">
                        <button className="pdf-viewer-btn zoom-btn" onClick={zoomOut}>-</button>
                        <span className="page-info">{Math.round(scale * 100)}%</span>
                        <button className="pdf-viewer-btn zoom-btn" onClick={zoomIn}>+</button>
                        <button className="pdf-viewer-btn" onClick={resetZoom}>รีเซ็ต</button>
                    </div>

                    <button className="pdf-viewer-btn close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>
            </div>

            <div className="pdf-viewer-content">
                {loading && <div className="pdf-loading">กำลังโหลด PDF...</div>}

                {error && (
                    <div className="pdf-error">
                        <h3>เกิดข้อผิดพลาด</h3>
                        <p>{error}</p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
                            <button className="pdf-viewer-btn" onClick={openInNewTab}>
                                เปิดในแท็บใหม่
                            </button>
                            <button className="pdf-viewer-btn" onClick={onClose}>
                                ปิด
                            </button>
                        </div>
                    </div>
                )}

                {!error && (
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        className="pdf-document"
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            className="pdf-page"
                        />
                    </Document>
                )}
            </div>
        </div>
    );
};

export default PdfViewer;