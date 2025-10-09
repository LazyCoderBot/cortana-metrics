# 📚 Examples Directory

This directory contains optimized examples for the cortana-metrics library, designed for better user understanding and learning.

## 🚀 Quick Start Examples

### 1. **quick-start.js** - Beginner Friendly
```bash
node examples/quick-start.js
```
- **Perfect for**: First-time users
- **Features**: Basic endpoint capture, simple OpenAPI generation
- **Time to understand**: 5 minutes
- **What you'll learn**: How to add middleware and generate API docs

### 2. **comprehensive-example.js** - Full Feature Demo
```bash
node examples/comprehensive-example.js
```
- **Perfect for**: Understanding all features
- **Features**: Complete data capture, sensitive data handling, real examples
- **Time to understand**: 15 minutes
- **What you'll learn**: All configuration options and advanced features

### 3. **advanced-openapi.js** - Production Ready
```bash
node examples/advanced-openapi.js
```
- **Perfect for**: Production applications
- **Features**: Postman compatibility, complex API patterns, error handling
- **Time to understand**: 20 minutes
- **What you'll learn**: Real-world API documentation patterns

## 🛠️ Specialized Examples

### 4. **enhanced-data-capture.js** - Data Analysis
- Advanced data capture with type analysis
- Sensitive field detection and redaction
- Data structure analysis

### 5. **custom-sensitive-fields.js** - Security Focus
- Custom sensitive field configuration
- Security best practices
- Data sanitization techniques

### 6. **cloud-storage-usage.js** - Storage Integration
- AWS S3, Azure, Google Cloud integration
- Remote storage configuration
- Cloud deployment patterns

### 7. **advanced-usage.js** - Enterprise Features
- Multiple collection management
- Version control and backups
- Enterprise-grade configuration

## 🎯 Which Example Should You Start With?

| Your Experience Level | Recommended Example | Why |
|----------------------|-------------------|-----|
| **New to API Documentation** | `quick-start.js` | Simple, clear, gets you running in 5 minutes |
| **Want to Learn All Features** | `comprehensive-example.js` | Shows everything with detailed comments |
| **Building Production APIs** | `advanced-openapi.js` | Real-world patterns and best practices |
| **Need Security Features** | `custom-sensitive-fields.js` | Focus on data protection and redaction |
| **Using Cloud Storage** | `cloud-storage-usage.js` | Remote storage and deployment patterns |

## 📋 What Each Example Generates

All examples generate OpenAPI specifications with:

- ✅ **Real captured data as examples** (not generic placeholders)
- ✅ **Postman compatibility** (simple example fields)
- ✅ **Swagger UI compatibility** (detailed examples objects)
- ✅ **Sensitive data redaction** (passwords, tokens, etc.)
- ✅ **Proper error responses** (400, 404, 500 status codes)
- ✅ **Schema generation** (automatic from captured data)

## 🚀 Getting Started

1. **Choose your example** based on your experience level
2. **Run the example**: `node examples/[example-name].js`
3. **Test the endpoints** using the provided URLs
4. **Check the generated OpenAPI spec** in the output directory
5. **Import into Postman or Swagger Editor** to see the magic!

## 💡 Pro Tips

- **Start with `quick-start.js`** if you're new to the library
- **Use `comprehensive-example.js`** to understand all features
- **Reference `advanced-openapi.js`** for production patterns
- **Check the console output** to see captured data in real-time
- **Import the generated specs** into your favorite API tools

## 🔧 Customization

Each example is fully documented and can be easily customized:

- **Change the port**: Modify the `port` variable
- **Adjust capture settings**: Modify the `EndpointCapture` configuration
- **Add your own routes**: Follow the existing patterns
- **Customize OpenAPI spec**: Modify the `openAPISpecOptions`

Happy coding! 🎉
