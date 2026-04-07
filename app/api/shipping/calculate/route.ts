import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { delivery_postcode, weight = 0.5, cod = 0 } = await req.json();

    if (!delivery_postcode) {
      return NextResponse.json({ error: 'Delivery postcode is required' }, { status: 400 });
    }

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    const pickup_postcode = process.env.SHIPROCKET_PICKUP_POSTCODE || '110001'; // Default placeholder

    if (!email || !password) {
      console.error('Shiprocket credentials missing');
      // Return a mock value if credentials are not set for demo purposes
      return NextResponse.json({ 
        shipping_cost: 60, 
        courier_name: 'Mock Express',
        estimated_delivery_days: 3,
        is_mock: true 
      });
    }

    // 1. Login to get token
    const loginRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) {
      const errorData = await loginRes.json();
      console.error('Shiprocket login failed:', errorData);
      return NextResponse.json({ error: 'Failed to authenticate with Shiprocket' }, { status: 500 });
    }

    const { token } = await loginRes.json();

    // 2. Check serviceability and get rates
    const serviceabilityUrl = new URL('https://apiv2.shiprocket.in/v1/external/courier/serviceability/');
    serviceabilityUrl.searchParams.append('pickup_postcode', pickup_postcode);
    serviceabilityUrl.searchParams.append('delivery_postcode', delivery_postcode);
    serviceabilityUrl.searchParams.append('weight', weight.toString());
    serviceabilityUrl.searchParams.append('cod', cod.toString());

    const rateRes = await fetch(serviceabilityUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!rateRes.ok) {
      const errorData = await rateRes.json();
      console.error('Shiprocket serviceability check failed:', errorData);
      return NextResponse.json({ error: 'Failed to calculate shipping rates' }, { status: 500 });
    }

    const rateData = await rateRes.json();
    
    // Find the cheapest available courier
    const availableCouriers = rateData.data?.available_courier_companies || [];
    if (availableCouriers.length === 0) {
      return NextResponse.json({ error: 'No shipping service available for this location' }, { status: 404 });
    }

    // Sort by rate and pick the first one
    const cheapestCourier = availableCouriers.sort((a: { rate: number }, b: { rate: number }) => a.rate - b.rate)[0];

    return NextResponse.json({
      shipping_cost: cheapestCourier.rate,
      courier_name: cheapestCourier.courier_name,
      estimated_delivery_days: cheapestCourier.etd,
      is_mock: false
    });

  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
