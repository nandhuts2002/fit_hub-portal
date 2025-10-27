import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const RevenuePredictor = () => {
  const [prediction, setPrediction] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionPeriod, setPredictionPeriod] = useState(30);
  const [analyticsPeriod, setAnalyticsPeriod] = useState(90);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/revenue-prediction?period=${predictionPeriod}`);
      if (response.data.success) {
        setPrediction(response.data.prediction);
        setAnalytics(response.data.analytics);
      } else {
        setError('Failed to fetch revenue prediction');
      }
    } catch (err) {
      setError('Error fetching revenue prediction: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/revenue-analytics?days=${analyticsPeriod}`);
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      } else {
        setError('Failed to fetch revenue analytics');
      }
    } catch (err) {
      setError('Error fetching revenue analytics: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [predictionPeriod]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return '📈';
    if (trend < 0) return '📉';
    return '➡️';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Revenue Predictor</h2>
        <div className="flex gap-2">
          <select
            value={predictionPeriod}
            onChange={(e) => setPredictionPeriod(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
          </select>
          <button
            onClick={fetchPrediction}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Loading...' : 'Predict Revenue'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {prediction && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Prediction Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Revenue Prediction</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Predicted Revenue ({predictionPeriod} days):</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(prediction.predicted_revenue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Confidence Level:</span>
                <span className={`font-semibold ${getConfidenceColor(prediction.confidence)}`}>
                  {formatPercentage(prediction.confidence)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Base Revenue:</span>
                <span className="text-lg font-medium text-gray-700">
                  {formatCurrency(prediction.base_revenue)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Adjustment Factor:</span>
                <span className="text-lg font-medium text-gray-700">
                  {prediction.adjustment_factor.toFixed(2)}x
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics Card */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Key Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Orders:</span>
                <span className="text-lg font-semibold text-green-600">
                  {analytics?.total_orders || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Order Value:</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(analytics?.avg_order_value || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Success Rate:</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatPercentage(analytics?.payment_success_rate || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Customer Retention:</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatPercentage(analytics?.customer_retention_rate || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights Section */}
      {prediction?.insights && prediction.insights.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Business Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {prediction.insights.map((insight, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision Tree Predictions */}
      {prediction?.predictions && prediction.predictions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Decision Tree Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {prediction.predictions.map((pred, index) => (
              <div key={index} className={`p-3 rounded-lg border ${
                pred[1] > 0 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    pred[1] > 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {pred[0].replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`text-sm font-bold ${
                    pred[1] > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {pred[1] > 0 ? '+' : ''}{pred[1].toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Section */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Revenue Analytics</h3>
          <div className="flex gap-2">
            <select
              value={analyticsPeriod}
              onChange={(e) => setAnalyticsPeriod(Number(e.target.value))}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
            </select>
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              {loading ? 'Loading...' : 'Refresh Analytics'}
            </button>
          </div>
        </div>

        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">Revenue Trends</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Trend:</span>
                  <span className="text-sm font-medium flex items-center gap-1">
                    {getTrendIcon(analytics.monthly_trend)}
                    {formatCurrency(Math.abs(analytics.monthly_trend))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Daily Trend:</span>
                  <span className="text-sm font-medium flex items-center gap-1">
                    {getTrendIcon(analytics.daily_trend)}
                    {formatCurrency(Math.abs(analytics.daily_trend))}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Daily Revenue:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(analytics.avg_daily_revenue || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Monthly Revenue:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(analytics.avg_monthly_revenue || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2">Order Status</h4>
              <div className="space-y-2">
                {Object.entries(analytics.revenue_by_status || {}).map(([status, revenue]) => (
                  <div key={status} className="flex justify-between">
                    <span className="text-sm text-gray-600">{status}:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenuePredictor;
