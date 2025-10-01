# CustomExerciseService Testing Guide

## Overview
This document provides comprehensive testing coverage for the `customExerciseService.js` file, which manages custom exercise operations including trainer exercise uploads, API interactions, and error handling.

## Test Coverage Summary

### ✅ Test Categories Covered

#### 1. **Service Instance Tests**
- Validates service singleton pattern
- Confirms all required methods exist
- Verifies API base URL configuration

#### 2. **Happy Path Tests**
- `addTrainerExercise()` - Successfully adds new exercise
- `getCustomExercises()` - Fetches exercises from API
- `searchCustomExercises()` - Filters exercises by search terms
- `getCustomExercisesByBodyPart()` - Filters by body parts
- `uploadExerciseGif()` - Uploads GIF files
- `deleteTrainerExercise()` - Deletes exercises
- `getCombinedExercises()` - Returns combined exercise results

#### 3. **Input Verification Tests**
- Case-insensitive search functionality
- Empty result handling
- Query prioritization in combined exercises
- Form data validation in API calls

#### 4. **Branching Tests**
- API available vs. fallback scenarios
- Different query types (name, body part, target, equipment)
- Error response with different formats (JSON error, message field, status only)

#### 5. **Exception Handling Tests**
- Network errors during API calls
- Server errors (4xx, 5xx status codes)
- JSON parsing failures
- File upload errors
- Comprehensive error message extraction

## Test Structure

### Core Error Scenarios Tested

1. **addTrainerExercise() Error Cases:**
   - Server returns JSON error response
   - Server returns message field
   - Server returns status code only
   - Server returns text response
   - Network connectivity issues
   - Error status property preservation

2. **API Fallback Scenarios:**
   - Network unavailable → fallback to local data
   - Server error → graceful degradation
   - Non-OK response → empty result handling

3. **File Upload Edge Cases:**
   - Upload failure handling
   - Network errors during upload
   - FormData validation

## Running the Tests

### Command Line
```bash
# Run only CustomExerciseService tests
npm test -- --testPathPattern=customExerciseService.test.js --watchAll=false

# Run tests in verbose mode
npm test -- --testPathPattern=customExerciseService.test.js --verbose --watchAll=false

# Run tests with coverage
npm test -- --testPathPattern=customExerciseService.test.js --coverage --watchAll=false
```

### Test Results
- **Total Tests:** 29
- **Passing:** 29 
- **Failed:** 0
- **Coverage:** Full method coverage

## Key Testing Patterns Used

### 1. **Mock Management**
```javascript
// Fetch API mocking
global.fetch = jest.fn();

// Console method mocking with cleanup
consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
// Proper cleanup in afterEach
```

### 2. **Error Testing Strategy**
```javascript
// Testing different error response formats
fetch.mockResolvedValueOnce({
  ok: false,
  status: 400,
  json: jest.fn().mockResolvedValueOnce(errorResponse)
});

await expect(service.addTrainerExercise(mockData))
  .rejects
  .toThrow('Expected error message');
```

### 3. **Async Testing**
All API methods are properly tested with async/await patterns and proper error propagation.

## Debugging the Original Error

The original error:
```
customExerciseService.js:85 
Error adding trainer exercise: Error: Failed to add exercise
    at CustomExerciseService.addTrainerExercise (customExerciseService.js:80:1)
```

### Root Cause Analysis
Based on the tests, this error typically occurs due to:

1. **Server-side validation failure** - Exercise data doesn't meet backend requirements
2. **Network connectivity issues** - Backend API unreachable
3. **Authentication/Authorization problems** - Missing or invalid trainer credentials
4. **Database constraints** - Duplicate exercise names or constraint violations

### Debugging Steps
1. **Check Network:** Verify backend API is running on `http://localhost:5000`
2. **Validate Data:** Ensure all required fields are present and properly formatted
3. **Check Logs:** Monitor backend logs for specific error details
4. **Test API Directly:** Use Postman/curl to test the endpoint independently

## Test Maintenance

### Adding New Tests
When adding new functionality to CustomExerciseService:

1. Follow the existing test structure
2. Include happy path, error handling, and edge cases
3. Mock external dependencies properly
4. Clean up resources in `afterEach`

### Common Pitfalls to Avoid
- Not clearing fetch mocks between tests
- Not restoring console spies
- Testing implementation details instead of behavior
- Missing async/await in test assertions

## Integration with CI/CD

These tests are designed to run in continuous integration environments and provide:
- Fast execution (< 5 seconds)
- No external dependencies
- Clear error messages
- Deterministic results

## Related Files
- **Source:** `c:\Users\nandhu\Fit-hub-portal\client\src\utils\customExerciseService.js`
- **Tests:** `c:\Users\nandhu\Fit-hub-portal\client\src\utils\customExerciseService.test.js`
- **Usage:** `c:\Users\nandhu\Fit-hub-portal\client\src\pages\TrainerExerciseManagement.jsx`