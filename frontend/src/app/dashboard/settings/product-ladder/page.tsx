'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ProductLadderStep {
  stepNumber: number
  productIds: string[]
  productTitles: string[]
  name: string
  description?: string
}

interface ProductLadder {
  id: string
  steps: ProductLadderStep[]
  active: boolean
}

export default function ProductLadderPage() {
  const [ladder, setLadder] = useState<ProductLadder | null>(null)
  const [steps, setSteps] = useState<ProductLadderStep[]>([
    {
      stepNumber: 1,
      productIds: [],
      productTitles: [],
      name: 'Entry Product',
      description: 'First product customers typically buy',
    },
  ])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProductLadder()
  }, [])

  const fetchProductLadder = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/merchants/product-ladder')
      if (response.ok) {
        const data = await response.json()
        if (data && data.steps) {
          setLadder(data)
          setSteps(data.steps)
        }
      }
    } catch (error) {
      console.error('Failed to fetch product ladder:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/merchants/product-ladder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps }),
      })

      if (response.ok) {
        const data = await response.json()
        setLadder(data)
        alert('Product ladder saved successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to save: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to save product ladder:', error)
      alert('Failed to save product ladder')
    } finally {
      setSaving(false)
    }
  }

  const addStep = () => {
    if (steps.length >= 3) {
      alert('Maximum 3 steps allowed')
      return
    }

    const nextStepNumber = steps.length + 1
    setSteps([
      ...steps,
      {
        stepNumber: nextStepNumber,
        productIds: [],
        productTitles: [],
        name: nextStepNumber === 2 ? 'Mid-Tier' : 'Premium',
        description: '',
      },
    ])
  }

  const removeStep = (stepNumber: number) => {
    const filtered = steps.filter((s) => s.stepNumber !== stepNumber)
    // Renumber steps
    const renumbered = filtered.map((s, idx) => ({
      ...s,
      stepNumber: idx + 1,
    }))
    setSteps(renumbered)
  }

  const updateStep = (stepNumber: number, field: string, value: any) => {
    setSteps(
      steps.map((s) =>
        s.stepNumber === stepNumber ? { ...s, [field]: value } : s,
      ),
    )
  }

  const addProduct = (stepNumber: number, productId: string, productTitle: string) => {
    setSteps(
      steps.map((s) =>
        s.stepNumber === stepNumber
          ? {
              ...s,
              productIds: [...s.productIds, productId],
              productTitles: [...s.productTitles, productTitle],
            }
          : s,
      ),
    )
  }

  const removeProduct = (stepNumber: number, index: number) => {
    setSteps(
      steps.map((s) =>
        s.stepNumber === stepNumber
          ? {
              ...s,
              productIds: s.productIds.filter((_, i) => i !== index),
              productTitles: s.productTitles.filter((_, i) => i !== index),
            }
          : s,
      ),
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-xl shadow-lg p-6 h-64"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/settings"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Settings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Product Ladder Configuration
          </h1>
          <p className="text-gray-600">
            Configure your product progression path to enable intelligent
            upselling in lifecycle flows
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            💡 How Product Ladders Work
          </h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• <strong>Step 1:</strong> Entry products (first purchase)</li>
            <li>• <strong>Step 2:</strong> Mid-tier upsells</li>
            <li>• <strong>Step 3:</strong> Premium products</li>
          </ul>
          <p className="text-sm text-blue-800 mt-2">
            Emails will automatically recommend the next step based on customer
            purchase history.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step) => (
            <div
              key={step.stepNumber}
              className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                      Step {step.stepNumber}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={step.name}
                    onChange={(e) =>
                      updateStep(step.stepNumber, 'name', e.target.value)
                    }
                    className="text-lg font-semibold text-gray-900 border-b border-gray-300 focus:border-blue-500 outline-none px-2 py-1 w-full mb-2"
                    placeholder="Step name"
                  />
                  <input
                    type="text"
                    value={step.description || ''}
                    onChange={(e) =>
                      updateStep(step.stepNumber, 'description', e.target.value)
                    }
                    className="text-sm text-gray-600 border-b border-gray-200 focus:border-blue-500 outline-none px-2 py-1 w-full"
                    placeholder="Optional description"
                  />
                </div>
                {steps.length > 1 && (
                  <button
                    onClick={() => removeStep(step.stepNumber)}
                    className="ml-4 px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Products */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Products in this step:
                </label>
                {step.productTitles.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded">
                    No products added yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {step.productTitles.map((title, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded"
                      >
                        <span className="text-sm text-gray-900">{title}</span>
                        <button
                          onClick={() => removeProduct(step.stepNumber, idx)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Product Form */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    const productId = prompt('Enter Shopify Product ID:')
                    const productTitle = prompt('Enter Product Title:')
                    if (productId && productTitle) {
                      addProduct(step.stepNumber, productId, productTitle)
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Product
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Note: In production, this would show a product picker from
                  your Shopify store
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Add Step Button */}
        {steps.length < 3 && (
          <button
            onClick={addStep}
            className="mt-6 w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <span className="text-lg">+ Add Step {steps.length + 1}</span>
            <p className="text-sm mt-1">
              {steps.length === 1 && 'Add a mid-tier product'}
              {steps.length === 2 && 'Add your premium product'}
            </p>
          </button>
        )}

        {/* Save Button */}
        <div className="mt-8 flex items-center justify-between bg-white rounded-xl shadow-lg p-6">
          <div>
            <p className="text-sm text-gray-600">
              {ladder
                ? 'Product ladder is active'
                : 'No product ladder configured'}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || steps.some((s) => s.productIds.length === 0)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Product Ladder'}
          </button>
        </div>

        {steps.some((s) => s.productIds.length === 0) && (
          <p className="text-sm text-red-600 text-center mt-4">
            All steps must have at least one product before saving
          </p>
        )}
      </div>
    </div>
  )
}
