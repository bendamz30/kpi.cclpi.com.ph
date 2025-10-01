<?php
// routes/api.php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    UserController,
    SalesTargetController,
    SalesReportController,
    AreaController,
    RegionController,
    SalesTypeController,
    SalesRepresentativeController,
    AuditLogController,
    DashboardController,
    TrashController
};

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes (no authentication required)
Route::post('/login', [UserController::class, 'login']);
Route::post('/logout', [UserController::class, 'logout']);

// Protected routes (authentication required)
Route::middleware('auth:sanctum')->group(function () {
    
    // User routes
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
        Route::get('/{id}/sales-targets', [UserController::class, 'getSalesTargets']);
        Route::get('/{id}/sales-reports', [UserController::class, 'getSalesReports']);
    });

    // Sales Targets routes
    Route::prefix('sales-targets')->group(function () {
        Route::get('/', [SalesTargetController::class, 'index']);
        Route::post('/', [SalesTargetController::class, 'store']);
        Route::get('/performance', [SalesTargetController::class, 'getTargetsWithPerformance']);
        Route::get('/aggregated', [SalesTargetController::class, 'getAggregatedTargets']);
        Route::get('/{id}', [SalesTargetController::class, 'show']);
        Route::put('/{id}', [SalesTargetController::class, 'update']);
        Route::delete('/{id}', [SalesTargetController::class, 'destroy']);
    });

    // Sales Reports routes
    Route::prefix('sales-reports')->group(function () {
        Route::get('/', [SalesReportController::class, 'index']);
        Route::post('/', [SalesReportController::class, 'store']);
        Route::get('/data', [SalesReportController::class, 'getReportsData']);
        Route::get('/merged', [SalesReportController::class, 'getMergedReports']);
        Route::get('/{id}', [SalesReportController::class, 'show']);
        Route::put('/{id}', [SalesReportController::class, 'update']);
        Route::delete('/{id}', [SalesReportController::class, 'destroy']);
        Route::get('/{id}/export/pdf', [SalesReportController::class, 'exportPDF']);
        Route::get('/{id}/export/excel', [SalesReportController::class, 'exportExcel']);
    });

    // Areas routes
    Route::prefix('areas')->group(function () {
        Route::get('/', [AreaController::class, 'index']);
        Route::post('/', [AreaController::class, 'store']);
        Route::get('/{id}', [AreaController::class, 'show']);
        Route::put('/{id}', [AreaController::class, 'update']);
        Route::delete('/{id}', [AreaController::class, 'destroy']);
        Route::get('/{id}/regions', [AreaController::class, 'getRegions']);
        Route::get('/{id}/users', [AreaController::class, 'getUsers']);
    });

    // Regions routes
    Route::prefix('regions')->group(function () {
        Route::get('/', [RegionController::class, 'index']);
        Route::post('/', [RegionController::class, 'store']);
        Route::get('/{id}', [RegionController::class, 'show']);
        Route::put('/{id}', [RegionController::class, 'update']);
        Route::delete('/{id}', [RegionController::class, 'destroy']);
        Route::get('/{id}/users', [RegionController::class, 'getUsers']);
        Route::get('/{id}/sales-reports', [RegionController::class, 'getSalesReports']);
    });

    // Sales Types routes
    Route::prefix('sales-types')->group(function () {
        Route::get('/', [SalesTypeController::class, 'index']);
        Route::post('/', [SalesTypeController::class, 'store']);
        Route::get('/{id}', [SalesTypeController::class, 'show']);
        Route::put('/{id}', [SalesTypeController::class, 'update']);
        Route::delete('/{id}', [SalesTypeController::class, 'destroy']);
        Route::get('/{id}/users', [SalesTypeController::class, 'getUsers']);
        Route::get('/{id}/sales-reports', [SalesTypeController::class, 'getSalesReports']);
    });

    // Sales Representatives routes (Legacy)
    Route::prefix('sales-representatives')->group(function () {
        Route::get('/', [SalesRepresentativeController::class, 'index']);
        Route::post('/', [SalesRepresentativeController::class, 'store']);
        Route::get('/{id}', [SalesRepresentativeController::class, 'show']);
        Route::put('/{id}', [SalesRepresentativeController::class, 'update']);
        Route::delete('/{id}', [SalesRepresentativeController::class, 'destroy']);
    });

    // Dashboard routes
    Route::prefix('dashboard')->group(function () {
        Route::get('/', [DashboardController::class, 'index']);
        Route::get('/kpi', [DashboardController::class, 'getKPI']);
        Route::get('/summary', [DashboardController::class, 'getSummary']);
        Route::get('/performance-chart', [DashboardController::class, 'getPerformanceChart']);
        Route::get('/stream', [DashboardController::class, 'stream']);
    });

    // Trash Bin routes (SystemAdmin only)
    Route::middleware('role:SystemAdmin')->prefix('trash')->group(function () {
        // Users trash
        Route::prefix('users')->group(function () {
            Route::get('/', [TrashController::class, 'getDeletedUsers']);
            Route::post('/{id}/restore', [TrashController::class, 'restoreUser']);
            Route::delete('/{id}', [TrashController::class, 'permanentlyDeleteUser']);
        });

        // Reports trash
        Route::prefix('reports')->group(function () {
            Route::get('/', [TrashController::class, 'getDeletedReports']);
            Route::post('/{id}/restore', [TrashController::class, 'restoreReport']);
            Route::delete('/{id}', [TrashController::class, 'permanentlyDeleteReport']);
        });
    });

    // Audit Logs routes (SystemAdmin only)
    Route::middleware('role:SystemAdmin')->prefix('audit-logs')->group(function () {
        Route::get('/', [AuditLogController::class, 'index']);
        Route::get('/{id}', [AuditLogController::class, 'show']);
        Route::get('/user/{userId}', [AuditLogController::class, 'getUserLogs']);
        Route::get('/table/{tableName}', [AuditLogController::class, 'getTableLogs']);
    });

    // Export routes
    Route::prefix('export')->group(function () {
        Route::get('/users/excel', [UserController::class, 'exportExcel']);
        Route::get('/users/pdf', [UserController::class, 'exportPDF']);
        Route::get('/sales-reports/excel', [SalesReportController::class, 'exportExcel']);
        Route::get('/sales-reports/pdf', [SalesReportController::class, 'exportPDF']);
        Route::get('/sales-targets/excel', [SalesTargetController::class, 'exportExcel']);
        Route::get('/sales-targets/pdf', [SalesTargetController::class, 'exportPDF']);
        Route::get('/dashboard/summary/excel', [DashboardController::class, 'exportSummaryExcel']);
        Route::get('/dashboard/summary/pdf', [DashboardController::class, 'exportSummaryPDF']);
    });

    // Bulk operations routes
    Route::prefix('bulk')->group(function () {
        Route::post('/users/delete', [UserController::class, 'bulkDelete']);
        Route::post('/sales-reports/delete', [SalesReportController::class, 'bulkDelete']);
        Route::post('/sales-targets/delete', [SalesTargetController::class, 'bulkDelete']);
        Route::post('/users/restore', [UserController::class, 'bulkRestore']);
        Route::post('/sales-reports/restore', [SalesReportController::class, 'bulkRestore']);
    });

    // Search routes
    Route::prefix('search')->group(function () {
        Route::get('/users', [UserController::class, 'search']);
        Route::get('/sales-reports', [SalesReportController::class, 'search']);
        Route::get('/sales-targets', [SalesTargetController::class, 'search']);
    });

    // Statistics routes
    Route::prefix('stats')->group(function () {
        Route::get('/overview', [DashboardController::class, 'getOverviewStats']);
        Route::get('/users', [UserController::class, 'getStats']);
        Route::get('/sales-reports', [SalesReportController::class, 'getStats']);
        Route::get('/sales-targets', [SalesTargetController::class, 'getStats']);
        Route::get('/performance', [DashboardController::class, 'getPerformanceStats']);
    });

    // User profile routes
    Route::prefix('profile')->group(function () {
        Route::get('/', [UserController::class, 'getProfile']);
        Route::put('/', [UserController::class, 'updateProfile']);
        Route::post('/change-password', [UserController::class, 'changePassword']);
        Route::post('/upload-avatar', [UserController::class, 'uploadAvatar']);
    });

    // Notification routes
    Route::prefix('notifications')->group(function () {
        Route::get('/', [UserController::class, 'getNotifications']);
        Route::post('/{id}/mark-read', [UserController::class, 'markNotificationAsRead']);
        Route::post('/mark-all-read', [UserController::class, 'markAllNotificationsAsRead']);
    });

    // File upload routes
    Route::prefix('upload')->group(function () {
        Route::post('/avatar', [UserController::class, 'uploadAvatar']);
        Route::post('/document', [SalesReportController::class, 'uploadDocument']);
        Route::post('/bulk-import', [UserController::class, 'bulkImport']);
    });

    // System routes (SystemAdmin only)
    Route::middleware('role:SystemAdmin')->prefix('system')->group(function () {
        Route::get('/health', [DashboardController::class, 'systemHealth']);
        Route::get('/backup', [DashboardController::class, 'createBackup']);
        Route::post('/restore', [DashboardController::class, 'restoreBackup']);
        Route::get('/logs', [AuditLogController::class, 'getSystemLogs']);
        Route::post('/maintenance', [DashboardController::class, 'toggleMaintenance']);
    });

});

// Fallback route for undefined API endpoints
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'API endpoint not found',
        'error' => 'The requested API endpoint does not exist'
    ], 404);
});

// Health check route (public)
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is healthy',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
});
