<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_admin_reports(): void
    {
        $response = $this->getJson('/api/v1/admin/reports');
        $response->assertStatus(401);
    }

    public function test_regular_customer_cannot_access_admin_reports(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
        ]);

        $token = $customer->createToken();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/reports');

        $response->assertStatus(403);
    }

    public function test_admin_can_access_admin_reports_and_inventory_movements(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $token = $admin->createToken();

        // Test reports
        $reportResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/reports');
        $reportResponse->assertStatus(200);

        // Test inventory movements
        $inventoryResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/inventory/movements');
        $inventoryResponse->assertStatus(200);
    }
}
