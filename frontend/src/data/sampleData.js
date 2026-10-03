// Sample deadlines are generated relative to page load so the demo never goes stale
const NOW = new Date();
const hoursFromNow = (hours) => {
    const d = new Date(NOW.getTime());
    d.setHours(d.getHours() + hours);
    return d.toISOString();
};
export const sampleOrders = [
    // Priority - Overdue
    {
        id: 'ORD-7001',
        customer: 'Alice Smith',
        product: 'Wireless Headphones',
        variant: 'Black',
        sku: 'EL-WH-BLK-01',
        barcode: '8901234567890',
        quantity: 1,
        status: 'pending',
        priority: 'priority',
        deadline: hoursFromNow(-1),
        createdAt: hoursFromNow(-25),
        value: 129.99,
        shippingAddress: '123 Tech St, Silicon Valley, CA'
    },
    {
        id: 'ORD-7002',
        customer: 'Bob Johnson',
        product: 'Mechanical Keyboard',
        variant: 'Blue Switches',
        sku: 'EL-MK-BLU-02',
        barcode: '8901234567891',
        quantity: 2,
        status: 'processing',
        priority: 'priority',
        deadline: hoursFromNow(-0.5),
        createdAt: hoursFromNow(-24),
        value: 150.00,
        shippingAddress: '456 Developer Ave, Austin, TX'
    },
    // Priority - At Risk (< 2 hrs)
    {
        id: 'ORD-7003',
        customer: 'Carol Williams',
        product: 'Gaming Mouse',
        variant: 'RGB',
        sku: 'EL-GM-RGB-03',
        barcode: '8901234567892',
        quantity: 1,
        status: 'pending',
        priority: 'priority',
        deadline: hoursFromNow(1),
        createdAt: hoursFromNow(-12),
        value: 59.99,
        shippingAddress: '789 Gamer Ln, Seattle, WA'
    },
    {
        id: 'ORD-7004',
        customer: 'David Brown',
        product: 'Running Shoes',
        variant: 'Size 10',
        sku: 'AP-RS-10-04',
        barcode: '8901234567893',
        quantity: 1,
        status: 'packed',
        priority: 'priority',
        deadline: hoursFromNow(1.5),
        createdAt: hoursFromNow(-10),
        value: 89.99,
        shippingAddress: '321 Runner Blvd, Portland, OR'
    },
    // Priority - Healthy
    {
        id: 'ORD-7005',
        customer: 'Eve Davis',
        product: 'Smart Watch',
        variant: 'Silver',
        sku: 'EL-SW-SLV-05',
        barcode: '8901234567894',
        quantity: 1,
        status: 'pending',
        priority: 'priority',
        deadline: hoursFromNow(24),
        createdAt: hoursFromNow(-2),
        value: 199.99,
        shippingAddress: '654 Fitness Way, Denver, CO'
    },
    // Standard Orders (17 items)
    { id: 'ORD-8001', customer: 'Frank Miller', product: 'Yoga Mat', variant: 'Purple', sku: 'SP-YM-PUR-06', barcode: '8902000000001', quantity: 1, status: 'pending', priority: 'standard', deadline: hoursFromNow(48), createdAt: hoursFromNow(-1), value: 29.99, shippingAddress: '111 Zen St' },
    { id: 'ORD-8002', customer: 'Grace Wilson', product: 'Coffee Maker', variant: 'Stainless Steel', sku: 'HK-CM-SS-07', barcode: '8902000000002', quantity: 1, status: 'processing', priority: 'standard', deadline: hoursFromNow(24), createdAt: hoursFromNow(-5), value: 79.99, shippingAddress: '222 Brew Rd' },
    { id: 'ORD-8003', customer: 'Harry Taylor', product: 'Dumbbells', variant: '10lb Pair', sku: 'SP-DB-10-08', barcode: '8902000000003', quantity: 1, status: 'packed', priority: 'standard', deadline: hoursFromNow(12), createdAt: hoursFromNow(-14), value: 45.00, shippingAddress: '333 Muscle Ave' },
    { id: 'ORD-8004', customer: 'Ivy Moore', product: 'Novel: The Great Gatsby', variant: 'Hardcover', sku: 'BK-TGG-HC-09', barcode: '8902000000004', quantity: 2, status: 'shipped', priority: 'standard', deadline: hoursFromNow(72), createdAt: hoursFromNow(-48), value: 40.00, shippingAddress: '444 Read Blvd' },
    { id: 'ORD-8005', customer: 'Jack Anderson', product: 'T-Shirt', variant: 'Large / Black', sku: 'AP-TS-LBLK-10', barcode: '8902000000005', quantity: 3, status: 'delivered', priority: 'standard', deadline: hoursFromNow(-10), createdAt: hoursFromNow(-80), value: 60.00, shippingAddress: '555 Cotton Way' },
    // Standard - Overdue & At Risk
    { id: 'ORD-8006', customer: 'Karen Thomas', product: 'Blender', variant: 'Red', sku: 'HK-BL-RED-11', barcode: '8902000000006', quantity: 1, status: 'pending', priority: 'standard', deadline: hoursFromNow(-2), createdAt: hoursFromNow(-50), value: 49.99, shippingAddress: '666 Mix St' },
    { id: 'ORD-8007', customer: 'Liam Jackson', product: 'Water Bottle', variant: 'Blue 32oz', sku: 'SP-WB-BLU-12', barcode: '8902000000007', quantity: 4, status: 'processing', priority: 'standard', deadline: hoursFromNow(1.5), createdAt: hoursFromNow(-46), value: 100.00, shippingAddress: '777 Hydration Rd' },
    { id: 'ORD-8008', customer: 'Mia White', product: 'Desk Lamp', variant: 'White', sku: 'HK-DL-WHT-13', barcode: '8902000000008', quantity: 1, status: 'pending', priority: 'standard', deadline: hoursFromNow(10), createdAt: hoursFromNow(-12), value: 25.99, shippingAddress: '888 Light Ln' },
    { id: 'ORD-8009', customer: 'Noah Harris', product: 'Backpack', variant: 'Grey', sku: 'AP-BP-GRY-14', barcode: '8902000000009', quantity: 1, status: 'packed', priority: 'standard', deadline: hoursFromNow(6), createdAt: hoursFromNow(-18), value: 65.00, shippingAddress: '999 Pack St' },
    { id: 'ORD-8010', customer: 'Olivia Martin', product: 'Novel: 1984', variant: 'Paperback', sku: 'BK-1984-PB-15', barcode: '8902000000010', quantity: 1, status: 'processing', priority: 'standard', deadline: hoursFromNow(20), createdAt: hoursFromNow(-4), value: 12.99, shippingAddress: '101 Orwell Rd' },
    { id: 'ORD-8011', customer: 'Paul Thompson', product: 'Sneakers', variant: 'Size 9', sku: 'AP-SN-9-16', barcode: '8902000000011', quantity: 1, status: 'shipped', priority: 'standard', deadline: hoursFromNow(24), createdAt: hoursFromNow(-24), value: 95.00, shippingAddress: '202 Shoe Blvd' },
    { id: 'ORD-8012', customer: 'Quinn Garcia', product: 'Tablet', variant: '64GB / Silver', sku: 'EL-TB-64-17', barcode: '8902000000012', quantity: 1, status: 'pending', priority: 'standard', deadline: hoursFromNow(48), createdAt: hoursFromNow(-2), value: 299.99, shippingAddress: '303 Tech Ave' },
    { id: 'ORD-8013', customer: 'Rachel Martinez', product: 'Throw Blanket', variant: 'Fleece / Beige', sku: 'HK-TB-BEI-18', barcode: '8902000000013', quantity: 2, status: 'processing', priority: 'standard', deadline: hoursFromNow(36), createdAt: hoursFromNow(-6), value: 50.00, shippingAddress: '404 Cozy Ln' },
    { id: 'ORD-8014', customer: 'Sam Robinson', product: 'Protein Powder', variant: 'Chocolate 2lb', sku: 'SP-PP-CHO-19', barcode: '8902000000014', quantity: 1, status: 'packed', priority: 'standard', deadline: hoursFromNow(5), createdAt: hoursFromNow(-15), value: 35.00, shippingAddress: '505 Gym St' },
    { id: 'ORD-8015', customer: 'Tina Clark', product: 'Cookbook', variant: 'Italian Cuisine', sku: 'BK-CB-ITA-20', barcode: '8902000000015', quantity: 1, status: 'pending', priority: 'standard', deadline: hoursFromNow(72), createdAt: hoursFromNow(-1), value: 22.00, shippingAddress: '606 Chef Blvd' },
    { id: 'ORD-8016', customer: 'Umar Rodriguez', product: 'USB-C Cable', variant: '6ft / Braided', sku: 'EL-UC-6FT-21', barcode: '8902000000016', quantity: 3, status: 'pending', priority: 'standard', deadline: hoursFromNow(8), createdAt: hoursFromNow(-16), value: 45.00, shippingAddress: '707 Charge Rd' },
    { id: 'ORD-8017', customer: 'Vera Lewis', product: 'Hoodie', variant: 'Medium / Navy', sku: 'AP-HD-MNAV-22', barcode: '8902000000017', quantity: 1, status: 'shipped', priority: 'standard', deadline: hoursFromNow(12), createdAt: hoursFromNow(-36), value: 45.00, shippingAddress: '808 Warm Way' },
];
const rawInventory = [
    // Critically Low (< 10%)
    { id: 'INV-001', sku: 'EL-WH-BLK-01', barcode: '8901234567890', name: 'Wireless Headphones', variant: 'Black', category: 'Electronics', quantity: 2, reorderPoint: 10, maxQuantity: 50, location: 'Aisle 1, Shelf A', lastUpdated: hoursFromNow(-1) },
    { id: 'INV-002', sku: 'EL-MK-BLU-02', barcode: '8901234567891', name: 'Mechanical Keyboard', variant: 'Blue Switches', category: 'Electronics', quantity: 1, reorderPoint: 15, maxQuantity: 100, location: 'Aisle 1, Shelf B', lastUpdated: hoursFromNow(-3) },
    { id: 'INV-003', sku: 'SP-YM-PUR-06', barcode: '8902000000001', name: 'Yoga Mat', variant: 'Purple', category: 'Sports', quantity: 0, reorderPoint: 20, maxQuantity: 150, location: 'Aisle 4, Shelf C', lastUpdated: hoursFromNow(-5) },
    // Low Stock (< 30%)
    { id: 'INV-004', sku: 'EL-GM-RGB-03', barcode: '8901234567892', name: 'Gaming Mouse', variant: 'RGB', category: 'Electronics', quantity: 12, reorderPoint: 15, maxQuantity: 50, location: 'Aisle 1, Shelf A', lastUpdated: hoursFromNow(-2) },
    { id: 'INV-005', sku: 'HK-CM-SS-07', barcode: '8902000000002', name: 'Coffee Maker', variant: 'Stainless Steel', category: 'Home & Kitchen', quantity: 8, reorderPoint: 10, maxQuantity: 40, location: 'Aisle 3, Shelf A', lastUpdated: hoursFromNow(-12) },
    { id: 'INV-006', sku: 'AP-RS-10-04', barcode: '8901234567893', name: 'Running Shoes', variant: 'Size 10', category: 'Apparel', quantity: 15, reorderPoint: 20, maxQuantity: 80, location: 'Aisle 2, Shelf D', lastUpdated: hoursFromNow(-8) },
    { id: 'INV-007', sku: 'HK-BL-RED-11', barcode: '8902000000006', name: 'Blender', variant: 'Red', category: 'Home & Kitchen', quantity: 5, reorderPoint: 8, maxQuantity: 30, location: 'Aisle 3, Shelf B', lastUpdated: hoursFromNow(-24) },
    // Healthy Stock
    { id: 'INV-008', sku: 'EL-SW-SLV-05', barcode: '8901234567894', name: 'Smart Watch', variant: 'Silver', category: 'Electronics', quantity: 45, reorderPoint: 15, maxQuantity: 100, location: 'Aisle 1, Shelf C', lastUpdated: hoursFromNow(-4) },
    { id: 'INV-009', sku: 'SP-DB-10-08', barcode: '8902000000003', name: 'Dumbbells', variant: '10lb Pair', category: 'Sports', quantity: 80, reorderPoint: 20, maxQuantity: 100, location: 'Aisle 4, Shelf A', lastUpdated: hoursFromNow(-48) },
    { id: 'INV-010', sku: 'BK-TGG-HC-09', barcode: '8902000000004', name: 'Novel: The Great Gatsby', variant: 'Hardcover', category: 'Books', quantity: 120, reorderPoint: 30, maxQuantity: 200, location: 'Aisle 5, Shelf A', lastUpdated: hoursFromNow(-72) },
    { id: 'INV-011', sku: 'AP-TS-LBLK-10', barcode: '8902000000005', name: 'T-Shirt', variant: 'Large / Black', category: 'Apparel', quantity: 250, reorderPoint: 50, maxQuantity: 400, location: 'Aisle 2, Shelf A', lastUpdated: hoursFromNow(-1) },
    { id: 'INV-012', sku: 'SP-WB-BLU-12', barcode: '8902000000007', name: 'Water Bottle', variant: 'Blue 32oz', category: 'Sports', quantity: 180, reorderPoint: 40, maxQuantity: 250, location: 'Aisle 4, Shelf B', lastUpdated: hoursFromNow(-6) },
    { id: 'INV-013', sku: 'HK-DL-WHT-13', barcode: '8902000000008', name: 'Desk Lamp', variant: 'White', category: 'Home & Kitchen', quantity: 65, reorderPoint: 20, maxQuantity: 120, location: 'Aisle 3, Shelf C', lastUpdated: hoursFromNow(-15) },
    { id: 'INV-014', sku: 'AP-BP-GRY-14', barcode: '8902000000009', name: 'Backpack', variant: 'Grey', category: 'Apparel', quantity: 55, reorderPoint: 15, maxQuantity: 100, location: 'Aisle 2, Shelf B', lastUpdated: hoursFromNow(-20) },
    { id: 'INV-015', sku: 'BK-1984-PB-15', barcode: '8902000000010', name: 'Novel: 1984', variant: 'Paperback', category: 'Books', quantity: 190, reorderPoint: 40, maxQuantity: 300, location: 'Aisle 5, Shelf B', lastUpdated: hoursFromNow(-30) },
    { id: 'INV-016', sku: 'AP-SN-9-16', barcode: '8902000000011', name: 'Sneakers', variant: 'Size 9', category: 'Apparel', quantity: 42, reorderPoint: 10, maxQuantity: 80, location: 'Aisle 2, Shelf C', lastUpdated: hoursFromNow(-10) },
    { id: 'INV-017', sku: 'EL-TB-64-17', barcode: '8902000000012', name: 'Tablet', variant: '64GB / Silver', category: 'Electronics', quantity: 38, reorderPoint: 10, maxQuantity: 60, location: 'Aisle 1, Shelf D', lastUpdated: hoursFromNow(-5) },
    { id: 'INV-018', sku: 'HK-TB-BEI-18', barcode: '8902000000013', name: 'Throw Blanket', variant: 'Fleece / Beige', category: 'Home & Kitchen', quantity: 85, reorderPoint: 25, maxQuantity: 150, location: 'Aisle 3, Shelf D', lastUpdated: hoursFromNow(-2) },
    { id: 'INV-019', sku: 'SP-PP-CHO-19', barcode: '8902000000014', name: 'Protein Powder', variant: 'Chocolate 2lb', category: 'Sports', quantity: 110, reorderPoint: 30, maxQuantity: 200, location: 'Aisle 4, Shelf D', lastUpdated: hoursFromNow(-18) },
    { id: 'INV-020', sku: 'BK-CB-ITA-20', barcode: '8902000000015', name: 'Cookbook', variant: 'Italian Cuisine', category: 'Books', quantity: 70, reorderPoint: 15, maxQuantity: 120, location: 'Aisle 5, Shelf C', lastUpdated: hoursFromNow(-11) },
    { id: 'INV-021', sku: 'EL-UC-6FT-21', barcode: '8902000000016', name: 'USB-C Cable', variant: '6ft / Braided', category: 'Electronics', quantity: 450, reorderPoint: 100, maxQuantity: 1000, location: 'Aisle 1, Shelf B', lastUpdated: hoursFromNow(-1) },
    { id: 'INV-022', sku: 'AP-HD-MNAV-22', barcode: '8902000000017', name: 'Hoodie', variant: 'Medium / Navy', category: 'Apparel', quantity: 95, reorderPoint: 20, maxQuantity: 200, location: 'Aisle 2, Shelf E', lastUpdated: hoursFromNow(-9) },
    { id: 'INV-023', sku: 'HK-PM-SET-23', barcode: '8902000000018', name: 'Pan Set', variant: 'Non-stick 3pc', category: 'Home & Kitchen', quantity: 40, reorderPoint: 10, maxQuantity: 80, location: 'Aisle 3, Shelf E', lastUpdated: hoursFromNow(-35) },
    { id: 'INV-024', sku: 'SP-TR-BLK-24', barcode: '8902000000019', name: 'Resistance Bands', variant: 'Set of 5', category: 'Sports', quantity: 130, reorderPoint: 25, maxQuantity: 250, location: 'Aisle 4, Shelf E', lastUpdated: hoursFromNow(-4) },
    { id: 'INV-025', sku: 'BK-SF-D-25', barcode: '8902000000020', name: 'Novel: Dune', variant: 'Paperback', category: 'Books', quantity: 85, reorderPoint: 20, maxQuantity: 150, location: 'Aisle 5, Shelf D', lastUpdated: hoursFromNow(-14) }
];
// Second warehouse holds overflow stock for lines that are low in the main warehouse
const WH2 = { 'EL-WH-BLK-01': 30, 'EL-MK-BLU-02': 40, 'SP-YM-PUR-06': 60, 'EL-GM-RGB-03': 20, 'HK-BL-RED-11': 12 };
export const sampleInventory = rawInventory.map(i => ({ ...i, wh2Quantity: WH2[i.sku] ?? 0 }));
export const samplePackedBoxes = [
    { id: 'BOX-9001', orderId: 'ORD-7004', customer: 'David Brown', contents: 'Running Shoes x1', weight: '1.2 kg', scheduledPickup: hoursFromNow(-2), status: 'missed', courier: 'FedEx', location: 'Dispatch Area A' },
    { id: 'BOX-9002', orderId: 'ORD-8003', customer: 'Harry Taylor', contents: 'Dumbbells x1', weight: '9.5 kg', scheduledPickup: hoursFromNow(1), status: 'waiting_pickup', courier: 'UPS', location: 'Dispatch Area B' },
    { id: 'BOX-9003', orderId: 'ORD-8009', customer: 'Noah Harris', contents: 'Backpack x1', weight: '0.8 kg', scheduledPickup: hoursFromNow(2), status: 'waiting_pickup', courier: 'USPS', location: 'Dispatch Area A' },
    { id: 'BOX-9004', orderId: 'ORD-8014', customer: 'Sam Robinson', contents: 'Protein Powder x1', weight: '1.1 kg', scheduledPickup: hoursFromNow(4), status: 'waiting_pickup', courier: 'FedEx', location: 'Dispatch Area C' },
    { id: 'BOX-9005', orderId: 'ORD-8004', customer: 'Ivy Moore', contents: 'Novel: The Great Gatsby x2', weight: '0.9 kg', scheduledPickup: hoursFromNow(-10), status: 'picked_up', courier: 'USPS', trackingId: 'USPS90987654321', location: 'Picked Up' },
    { id: 'BOX-9006', orderId: 'ORD-8011', customer: 'Paul Thompson', contents: 'Sneakers x1', weight: '1.0 kg', scheduledPickup: hoursFromNow(-6), status: 'picked_up', courier: 'UPS', trackingId: '1Z9999999999999999', location: 'Picked Up' },
    { id: 'BOX-9007', orderId: 'ORD-8017', customer: 'Vera Lewis', contents: 'Hoodie x1', weight: '0.5 kg', scheduledPickup: hoursFromNow(-4), status: 'picked_up', courier: 'FedEx', trackingId: 'FDX1234567890', location: 'Picked Up' },
];
export const sampleIssues = [
    { id: 'ISS-001', title: 'Inventory mismatch on Mechanical Keyboards', description: 'System shows 1 in stock, but shelf is empty. Need to audit aisle 1.', severity: 'high', category: 'stock', status: 'open', reportedAt: hoursFromNow(-2), reportedBy: 'John Warehouse', aiSuggestion: 'Check recent order ORD-7002 which includes this item. It might have been picked but not scanned.' },
    { id: 'ISS-002', title: 'FedEx missed 2PM pickup', description: 'FedEx driver did not arrive for the scheduled 2PM pickup window.', severity: 'medium', category: 'courier', status: 'investigating', reportedAt: hoursFromNow(-1), reportedBy: 'Sarah Dispatch', aiSuggestion: 'Contact FedEx dispatch at 1-800-GO-FEDEX with account #44556. Re-route BOX-9001 to evening pickup if possible.' },
    { id: 'ISS-003', title: 'Barcode scanner #4 battery dying quickly', description: 'Scanner needs charging after only 2 hours of use.', severity: 'low', category: 'system', status: 'open', reportedAt: hoursFromNow(-5), reportedBy: 'Mike Picker', aiSuggestion: 'Log ticket with IT to replace battery unit for Scanner #4. Use spare Scanner #7 in the meantime.' },
    { id: 'ISS-004', title: 'Damaged packaging for Yoga Mats', description: 'Water leak from roof damaged 3 boxes of purple yoga mats.', severity: 'critical', category: 'stock', status: 'investigating', reportedAt: hoursFromNow(-8), reportedBy: 'Manager Dave', aiSuggestion: 'Move remaining stock to Aisle 4, Shelf D. Mark 3 units as damaged in system (SKU: SP-YM-PUR-06). Alert maintenance for roof repair.' },
    { id: 'ISS-005', title: 'Label printer out of alignment', description: 'Shipping labels are printing off-center, causing scanning issues for couriers.', severity: 'medium', category: 'packing', status: 'resolved', reportedAt: hoursFromNow(-24), resolvedAt: hoursFromNow(-20), reportedBy: 'Emily Packer', aiSuggestion: 'Run printer calibration sequence. Clean print head with alcohol wipe.' },
    { id: 'ISS-006', title: 'System lag during bulk order import', description: 'Orders took 15 minutes to sync from Shopify this morning.', severity: 'medium', category: 'system', status: 'resolved', reportedAt: hoursFromNow(-30), resolvedAt: hoursFromNow(-29), reportedBy: 'IT Support', aiSuggestion: 'API rate limit was hit. Batch imports have been adjusted to 50 orders per minute to prevent recurrence.' },
    { id: 'ISS-007', title: 'Wrong item packed for ORD-8005', description: 'Customer received blue t-shirt instead of black.', severity: 'high', category: 'shipping', status: 'resolved', reportedAt: hoursFromNow(-48), resolvedAt: hoursFromNow(-40), reportedBy: 'CS Team', aiSuggestion: 'Initiate return label for customer. Create replacement order with expedited shipping. Re-train packer on barcode verification.' },
    { id: 'ISS-008', title: 'Low stock on packing tape', description: 'Only 2 rolls left at packing station B.', severity: 'low', category: 'packing', status: 'open', reportedAt: hoursFromNow(-0.5), reportedBy: 'Emily Packer', aiSuggestion: 'Order new supplies via procurement portal. Request 20 rolls of 2-inch heavy duty clear tape.' },
    { id: 'ISS-009', title: 'Address validation failed for ORD-8012', description: 'System flagged address as undeliverable.', severity: 'medium', category: 'shipping', status: 'open', reportedAt: hoursFromNow(-1.5), orderId: 'ORD-8012', reportedBy: 'System', aiSuggestion: 'Customer address "303 Tech Ave" missing apartment number. Email customer to clarify unit/suite before dispatch.' },
    { id: 'ISS-010', title: 'UPS Ground tracking numbers not updating', description: 'Tracking numbers generated today are showing invalid on UPS site.', severity: 'high', category: 'system', status: 'investigating', reportedAt: hoursFromNow(-3), reportedBy: 'CS Team', aiSuggestion: 'Known UPS API issue reported on their status page. Tracking should update within 24 hours. No action needed on our end.' },
];
const ORDER_NAMES = ['Aarav Sharma', 'Diya Mehta', 'Rohan Kapoor', 'Ananya Singh', 'Kabir Verma', 'Isha Nair', 'Arjun Rao', 'Meera Joshi', 'Vihaan Shah', 'Sara Khan'];
const ORDER_PRODUCTS = [
    ['Wireless Headphones', 'Black', 'EL-WH-BLK-01', '8901234567890'],
    ['Mechanical Keyboard', 'Blue Switches', 'EL-MK-BLU-02', '8901234567891'],
    ['Gaming Mouse', 'RGB', 'EL-GM-RGB-03', '8901234567892'],
    ['Running Shoes', 'Size 10', 'AP-RS-10-04', '8901234567893'],
    ['Smart Watch', 'Silver', 'EL-SW-SLV-05', '8901234567894'],
    ['Yoga Mat', 'Purple', 'SP-YM-PUR-06', '8902000000001'],
    ['Coffee Maker', 'Stainless Steel', 'HK-CM-SS-07', '8902000000002'],
    ['Dumbbells', '10lb Pair', 'SP-DB-10-08', '8902000000003'],
    ['Backpack', 'Grey', 'AP-BP-GRY-14', '8902000000009'],
    ['Tablet', '64GB / Silver', 'EL-TB-64-17', '8902000000012'],
];
const extraStatuses = ['pending', 'processing', 'processing', 'packed', 'pending', 'packed', 'staged', 'shipped'];
export const sampleOrders250 = Array.from({ length: 250 }, (_, idx) => {
    const n = idx + 1, product = ORDER_PRODUCTS[idx % ORDER_PRODUCTS.length];
    const status = idx < sampleOrders.length ? sampleOrders[idx].status : extraStatuses[idx % extraStatuses.length];
    const hours = status === 'shipped' ? -8 : status === 'staged' ? 3 : (idx % 19) + 2;
    return {
        id: `ORD-${9000 + n}`, customer: ORDER_NAMES[idx % ORDER_NAMES.length],
        product: product[0], variant: product[1], sku: product[2], barcode: product[3],
        quantity: (idx % 4) + 1, status, priority: idx % 9 === 0 ? 'priority' : 'standard',
        deadline: hoursFromNow(hours), createdAt: hoursFromNow(-(idx % 72)),
        value: 25 + ((idx * 37) % 275), shippingAddress: `${10 + n} ${['MG Road', 'Indiranagar', 'Whitefield', 'HSR Layout'][idx % 4]}, Bengaluru`,
        scanned: status === 'packed' || status === 'staged' || status === 'shipped' ? (idx % 4) + 1 : 0
    };
});
export const sampleStagingBays = [
    { id: 'B-01', name: 'Bay B-01', capacity: 12, boxIds: ['BOX-9002'], courier: 'UPS Next Day', pickupTime: hoursFromNow(1) },
    { id: 'B-02', name: 'Bay B-02', capacity: 12, boxIds: ['BOX-9003'], courier: 'Royal Mail', pickupTime: hoursFromNow(2) },
    { id: 'B-03', name: 'Bay B-03', capacity: 8, boxIds: ['BOX-9004'], courier: 'FedEx Ground', pickupTime: hoursFromNow(4) },
    { id: 'B-04', name: 'Bay B-04', capacity: 10, boxIds: [], courier: 'FedEx Ground', pickupTime: hoursFromNow(3) }
];
export const sampleReceiving = [
    { id: 'RCV-1001', supplier: 'Northstar Imports', poNumber: 'PO-4821', sku: 'EL-WH-BLK-01', product: 'Wireless Headphones', expectedQty: 50, receivedQty: 50, status: 'received', eta: hoursFromNow(-3), dock: 'Dock 1' },
    { id: 'RCV-1002', supplier: 'TechSource India', poNumber: 'PO-4822', sku: 'EL-MK-BLU-02', product: 'Mechanical Keyboard', expectedQty: 40, receivedQty: 28, status: 'exception', eta: hoursFromNow(-1), dock: 'Dock 2' },
    { id: 'RCV-1003', supplier: 'Urban Sports', poNumber: 'PO-4823', sku: 'SP-YM-PUR-06', product: 'Yoga Mat', expectedQty: 60, receivedQty: 0, status: 'expected', eta: hoursFromNow(4), dock: 'Dock 3' },
    { id: 'RCV-1004', supplier: 'HomePro', poNumber: 'PO-4824', sku: 'HK-CM-SS-07', product: 'Coffee Maker', expectedQty: 30, receivedQty: 12, status: 'receiving', eta: hoursFromNow(-0.5), dock: 'Dock 1' }
];
