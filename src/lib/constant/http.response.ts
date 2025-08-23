export const HttpRes = Object.freeze({
  status: {
    // success
    OK: 200,
    RESOURCE_CREATED: 201,
    RESOURCE_UPDATED: 200,
    RESOURCE_DELETED: 204,
    OPERATION_SUCCESSFUL: 200,
    ACTION_COMPLETED: 200,
    REDIRECTED: 302,

    // error
    INTERNAL_SERVER_ERROR: 500,
    VALIDATION_ERROR: 422,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    BAD_REQUEST: 400,
    SERVICE_UNAVAILABLE: 503,
    CONFLICT: 409,
  },
  message: {
    // success
    OK: 'OK',
    RESOURCE_CREATED: 'Created',
    RESOURCE_UPDATED: 'Updated',
    RESOURCE_DELETED: 'Deleted',
    OPERATION_SUCCESSFUL: 'Operation Successful',
    ACTION_COMPLETED: 'Action Completed',
    REDIRECTED: 'Redirected',

    // error
    INTERNAL_SERVER_ERROR: 'Internal Server Error',
    VALIDATION_ERROR: 'Validation Error',
    NOT_FOUND: 'Resource Not Found',
    UNAUTHORIZED: 'Unauthorized Access',
    FORBIDDEN: 'Forbidden Access',
    BAD_REQUEST: 'Bad Request',
    SERVICE_UNAVAILABLE: 'Service Unavailable',
    CONFLICT: 'Conflict Detected',
  },
  details: {
    // success
    OK: 'OK',
    RESOURCE_CREATED: 'Resource created successfully',
    RESOURCE_UPDATED: 'Resource updated successfully',
    RESOURCE_DELETED: 'Resource deleted successfully',
    OPERATION_SUCCESSFUL: 'Operation completed successfully',
    ACTION_COMPLETED: 'Action completed successfully',
    REDIRECTED: 'Redirected',

    // error
    UNEXPECTED_ERROR: 'An unexpected error occurred',
    NOT_FOUND: 'The requested resource was not found',
    UNAUTHORIZED: 'You are not authorized to access this resource',
    FORBIDDEN: 'You do not have permission to perform this action',
    BAD_REQUEST: 'The request was invalid or cannot be served',
    INTERNAL_SERVER_ERROR: 'An internal server error occurred',
    SERVICE_UNAVAILABLE: 'The service is currently unavailable',
    CONFLICT: 'A conflict occurred with the current state of the resource',
  },
});
