'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface QuestionFormProps {
  onComplete?: (answers: {
    origin: string
    destination: string
    passengers: string
  }) => void
}

export function QuestionForm({ onComplete }: QuestionFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [passengers, setPassengers] = useState("")

  const handleNext = () => {
    if (currentStep === 1 && origin) {
      setCurrentStep(2)
    } else if (currentStep === 2 && destination) {
      setCurrentStep(3)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passengers) {
      onComplete?.({ origin, destination, passengers })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Flight Information</FieldLegend>
            <FieldDescription>
              Step {currentStep} of 3
            </FieldDescription>
            <FieldGroup>
              {currentStep === 1 && (
                <Field>
                  <FieldLabel htmlFor="branch-origin">
                    1. Enter the branch of origin
                  </FieldLabel>
                  <Select value={origin} onValueChange={setOrigin}>
                    <SelectTrigger id="branch-origin">
                      <SelectValue placeholder="Select origin branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mexico-city">Mexico City</SelectItem>
                      <SelectItem value="guadalajara">Guadalajara</SelectItem>
                      <SelectItem value="monterrey">Monterrey</SelectItem>
                      <SelectItem value="cancun">Cancun</SelectItem>
                      <SelectItem value="tijuana">Tijuana</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {currentStep === 2 && (
                <Field>
                  <FieldLabel htmlFor="destination">
                    2. Enter the destination
                  </FieldLabel>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger id="destination">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mexico-city">Mexico City</SelectItem>
                      <SelectItem value="guadalajara">Guadalajara</SelectItem>
                      <SelectItem value="monterrey">Monterrey</SelectItem>
                      <SelectItem value="cancun">Cancun</SelectItem>
                      <SelectItem value="tijuana">Tijuana</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {currentStep === 3 && (
                <Field>
                  <FieldLabel htmlFor="passengers">
                    3. Enter the number of passengers
                  </FieldLabel>
                  <Input
                    id="passengers"
                    type="number"
                    min="1"
                    max="239"
                    placeholder="Number of passengers"
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                    required
                  />
                  <FieldDescription>
                    Enter the total number of passengers (1-239)
                  </FieldDescription>
                </Field>
              )}
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            {currentStep > 1 && (
              <Button variant="outline" type="button" onClick={handleBack}>
                Back
              </Button>
            )}
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !origin) ||
                  (currentStep === 2 && !destination)
                }
              >
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={!passengers}>
                Submit
              </Button>
            )}
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}