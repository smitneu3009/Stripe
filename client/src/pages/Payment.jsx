import React, { useState } from 'react';
import StripeCheckout from 'react-stripe-checkout';
import { useNavigate } from 'react-router-dom';
import './../App.css';

function Payment() {
    const [product, setProduct] = useState({
        name: "Premium Subscription",
        price: 20, // Default price
        productBy: "My Company"
    });

    const navigate = useNavigate();

    const makePayment = async (token) => {
        const body = {
            token,
            product
        };
        const headers = {
            "Content-Type": "application/json"
        };

        try {
            const response = await fetch(`http://localhost:8000/payment`, {
                method: "POST",
                headers,
                body: JSON.stringify(body)
            });
            if (response.status === 200) {
                // Redirect to the thank-you page if payment is successful
                navigate("/thank-you");
            } else {
                console.log("Payment failed");
            }
        } catch (err) {
            console.log(err);
        }
    };

    const handlePriceChange = (event) => {
        const selectedPrice = parseInt(event.target.value, 10); // Make sure to parse the value correctly
        setProduct(prevProduct => ({
            ...prevProduct,
            price: selectedPrice
        }));
    };

    return (
        <div className="payment-container">
            <h1>Subscribe to {product.name}</h1>
            <p>Select a subscription plan that suits your needs:</p>

            {/* Dropdown to select price */}
            <div className="price-selector">
                <label htmlFor="price-select" className="price-label">Select Subscription Price:</label>
                <select
                    id="price-select"
                    value={product.price}
                    onChange={handlePriceChange}
                    className="price-dropdown"
                >
                    <option value={20}>$20</option>
                    <option value={50}>$50</option>
                    <option value={75}>$75</option>
                    <option value={100}>$100</option>
                </select>
            </div>

            <StripeCheckout
                stripeKey={import.meta.env.VITE_STRIPE_KEY}
                token={makePayment}
                name="Premium Subscription"
                amount={product.price * 100} // Stripe expects the amount in cents
                description={`Purchase of ${product.name}`}
                panelLabel="Pay Now"
                billingAddress
                shippingAddress
                image="https://img.icons8.com/color/96/stripe.png"
            >
                <button className="btn-pay">
                    Pay ${product.price}
                </button>
            </StripeCheckout>
        </div>
    );
}

export default Payment;
