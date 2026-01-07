# Amazon Integration Guide

## Overview

TSV Ledger integrates with Amazon order data to provide comprehensive expense tracking and analysis. The system processes Amazon ZIP files containing order history, item details, and transaction data, automatically extracting and categorizing Amazon purchases.

## Key Features

- **ZIP File Processing**: Secure extraction and validation of Amazon data archives
- **Data Parsing**: Robust CSV parsing with error handling and data validation
- **Expense Generation**: Automatic conversion of Amazon orders to standardized expense records
- **API Integration**: RESTful endpoints for data import and management
- **Error Handling**: Comprehensive error management with detailed user feedback
- **Testing**: Complete test coverage including unit, integration, and E2E tests
- **Performance**: Optimized processing with monitoring and performance tracking

## Component Documentation

This documentation is organized into focused components for better maintainability:

### Core Components
- **[Data Sources](amazon-integration/data-sources.md)**: Amazon data formats and file structures
- **[ZIP Processing](amazon-integration/zip-processing.md)**: File extraction and security validation
- **[Data Parsing](amazon-integration/data-parsing.md)**: CSV parsing and data transformation
- **[Data Integration](amazon-integration/data-integration.md)**: Order-item matching and expense generation

### API and Operations
- **[API Integration](amazon-integration/api-integration.md)**: REST endpoints and request handling
- **[Error Handling](amazon-integration/error-handling.md)**: Validation and error management
- **[Testing](amazon-integration/testing.md)**: Test strategies and coverage
- **[Performance](amazon-integration/performance.md)**: Optimization and monitoring

## Quick Start

1. **Upload Amazon Data**: Use the `/api/amazon/upload` endpoint to import ZIP files
2. **Monitor Processing**: Check status via `/api/amazon/status/:uploadId`
3. **Access Expenses**: Retrieve Amazon expenses via `/api/amazon/expenses`
4. **Data Management**: Delete or modify records as needed

## Architecture

The Amazon integration follows a modular architecture:

```
Amazon ZIP File
       ↓
ZIP Extraction (secure temp directory)
       ↓
CSV Parsing (order + item data)
       ↓
Data Integration (order-item matching)
       ↓
Expense Generation (standardized records)
       ↓
Database Storage (with validation)
       ↓
API Access (RESTful endpoints)
```

## Data Flow

1. **File Upload**: User uploads Amazon ZIP file via web interface
2. **Validation**: File format and size validation
3. **Extraction**: Secure extraction to temporary directory
4. **Parsing**: CSV files parsed into structured data objects
5. **Integration**: Orders matched with items, expenses generated
6. **Storage**: Expense records saved to database with metadata
7. **Response**: Processing results returned to user

## Security Considerations

- **File validation**: Strict ZIP format and size limits
- **Path security**: Secure temporary directory creation
- **Data sanitization**: Input validation and SQL injection prevention
- **Access control**: Authentication and authorization checks
- **Audit logging**: Comprehensive logging of all operations

## Error Scenarios

Common error conditions and handling:

- **Invalid ZIP files**: Format validation with clear error messages
- **Missing data**: Required field validation with specific feedback
- **Processing failures**: Graceful error handling with cleanup
- **Database errors**: Transaction rollback and error reporting
- **Timeout issues**: Processing time limits with status tracking

## Performance Characteristics

- **File size limit**: 50MB maximum ZIP file size
- **Processing time**: Typically < 30 seconds for standard files
- **Memory usage**: Streaming processing for large files
- **Concurrent uploads**: Support for multiple simultaneous operations
- **Success rate**: > 95% for valid Amazon data files

## Monitoring and Maintenance

- **Health checks**: API endpoints for system status monitoring
- **Performance metrics**: Processing time and success rate tracking
- **Error logging**: Detailed error categorization and reporting
- **Resource monitoring**: Memory and disk usage tracking
- **Automated cleanup**: Temporary file management and removal

## Testing and Quality Assurance

- **Unit tests**: Individual component testing with mocks
- **Integration tests**: API endpoint testing with real data
- **E2E tests**: Complete workflow testing from upload to retrieval
- **Performance tests**: Load testing and stress testing
- **Data validation**: Test data integrity and accuracy

## Troubleshooting

### Common Issues

**Upload Failures**
- Verify ZIP file is valid and under 50MB
- Check file contains expected Amazon CSV files
- Ensure proper permissions for file uploads

**Data Processing Errors**
- Validate CSV files have required columns
- Check for corrupted or malformed data
- Review error logs for specific failure details

**Performance Issues**
- Monitor system resources during processing
- Check database connection and performance
- Review processing metrics for bottlenecks

### Support Resources

- **API Documentation**: Detailed endpoint specifications
- **Error Reference**: Complete error code and message guide
- **Performance Guide**: Optimization and monitoring best practices
- **Testing Guide**: Comprehensive testing strategies and examples

## Future Enhancements

Planned improvements and features:

- **Real-time sync**: Direct Amazon API integration
- **Enhanced categorization**: Machine learning-based category detection
- **Subscription tracking**: Automated subscription expense monitoring
- **Return processing**: Advanced return and refund handling
- **Multi-account support**: Multiple Amazon account management
- **Advanced analytics**: Spending pattern analysis and insights

---

*This documentation follows the componentized architecture with each major section broken into focused, maintainable modules under 300 lines each.*