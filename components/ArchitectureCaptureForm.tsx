"use client"

import { useState } from "react"
import { useForm, FormProvider, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { PlusCircle, Trash2, ArrowRight, ArrowLeft, Save } from "lucide-react"
import { architectureSchema, type ArchitectureInput } from "@/lib/architecture-schema"
import { CostPreviewCard } from "@/components/CostPreviewCard"
import { BrandAssetsSection } from "@/components/BrandAssetsSection"

const steps = [
  { id: "basics", label: "Project Basics" },
  { id: "mvp", label: "MVP Flow" },
  { id: "future", label: "Future & Integrations" },
  { id: "personas", label: "Personas & Constraints" },
  { id: "tech", label: "Tech & Budget" },
]

export function ArchitectureCaptureForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [brandAssets, setBrandAssets] = useState<any>(null)
  const [roadmapData, setRoadmapData] = useState<any>(null)

  const methods = useForm<ArchitectureInput>({
    resolver: zodResolver(architectureSchema),
    defaultValues: {
      projectBasics: {
        projectName: "",
        businessOverview: "",
        projectGoals: "",
        targetLaunchDate: "",
        expectedUserCount: "",
      },
      mvpFeatures: [
        {
          name: "",
          description: "",
          priority: "high",
          complexity: "m",
          userStories: [""],
        },
      ],
      futureFeatures: [],
      integrations: [],
      personas: [
        {
          name: "",
          role: "",
          goals: "",
          painPoints: "",
        },
      ],
      technicalConstraints: "",
      businessConstraints: "",
      preferredTechnologies: "",
      budget: 0,
      timeline: "",
      additionalComments: "",
    },
  })

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = methods

  const {
    fields: mvpFields,
    append: appendMvp,
    remove: removeMvp,
  } = useFieldArray({
    control,
    name: "mvpFeatures",
  })

  const {
    fields: futureFields,
    append: appendFuture,
    remove: removeFuture,
  } = useFieldArray({
    control,
    name: "futureFeatures",
  })

  const {
    fields: integrationFields,
    append: appendIntegration,
    remove: removeIntegration,
  } = useFieldArray({
    control,
    name: "integrations",
  })

  const {
    fields: personaFields,
    append: appendPersona,
    remove: removePersona,
  } = useFieldArray({
    control,
    name: "personas",
  })

  const {
    fields: userStoryFields,
    append: appendUserStory,
    remove: removeUserStory,
  } = useFieldArray({
    control,
    name: `mvpFeatures.0.userStories`,
  })

  const watchedBudget = watch("budget")
  const watchedMvpFeatures = watch("mvpFeatures")

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: ArchitectureInput) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch("/api/architect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          brandAssets,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit architecture data")
      }

      const result = await response.json()
      setRoadmapData(result)

      // Move to the final step or show success
      setCurrentStep(steps.length - 1)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBrandAssetsComplete = (assets: any) => {
    setBrandAssets(assets)
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Architecture Blueprint</h2>
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`h-2 w-2 rounded-full ${
                  index === currentStep ? "bg-primary" : index < currentStep ? "bg-primary/60" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep].label}</CardTitle>
          </CardHeader>

          <CardContent>
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      {...methods.register("projectBasics.projectName")}
                      placeholder="Enter project name"
                    />
                    {errors.projectBasics?.projectName && (
                      <p className="text-sm text-red-500">{errors.projectBasics.projectName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessOverview">Business Overview</Label>
                    <Textarea
                      id="businessOverview"
                      {...methods.register("projectBasics.businessOverview")}
                      placeholder="Describe your business and its core offerings"
                      rows={3}
                    />
                    {errors.projectBasics?.businessOverview && (
                      <p className="text-sm text-red-500">{errors.projectBasics.businessOverview.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectGoals">Project Goals</Label>
                    <Textarea
                      id="projectGoals"
                      {...methods.register("projectBasics.projectGoals")}
                      placeholder="What are the main goals of this project?"
                      rows={3}
                    />
                    {errors.projectBasics?.projectGoals && (
                      <p className="text-sm text-red-500">{errors.projectBasics.projectGoals.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="targetLaunchDate">Target Launch Date</Label>
                      <Input
                        id="targetLaunchDate"
                        {...methods.register("projectBasics.targetLaunchDate")}
                        placeholder="e.g., Q3 2023, December 2023"
                      />
                      {errors.projectBasics?.targetLaunchDate && (
                        <p className="text-sm text-red-500">{errors.projectBasics.targetLaunchDate.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedUserCount">Expected User Count</Label>
                      <Input
                        id="expectedUserCount"
                        {...methods.register("projectBasics.expectedUserCount")}
                        placeholder="e.g., 100-500, 1000+"
                      />
                      {errors.projectBasics?.expectedUserCount && (
                        <p className="text-sm text-red-500">{errors.projectBasics.expectedUserCount.message}</p>
                      )}
                    </div>
                  </div>

                  <BrandAssetsSection onComplete={handleBrandAssetsComplete} />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">MVP Features</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendMvp({
                        name: "",
                        description: "",
                        priority: "high",
                        complexity: "m",
                        userStories: [""],
                      })
                    }
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Feature
                  </Button>
                </div>

                {mvpFields.map((field, index) => (
                  <Card key={field.id} className="border border-gray-200">
                    <CardHeader className="bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-medium">Feature {index + 1}</h4>
                        {index > 0 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeMvp(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`mvpFeatures.${index}.name`}>Feature Name</Label>
                        <Input
                          id={`mvpFeatures.${index}.name`}
                          {...methods.register(`mvpFeatures.${index}.name`)}
                          placeholder="e.g., User Authentication"
                        />
                        {errors.mvpFeatures?.[index]?.name && (
                          <p className="text-sm text-red-500">{errors.mvpFeatures[index]?.name?.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`mvpFeatures.${index}.description`}>Description</Label>
                        <Textarea
                          id={`mvpFeatures.${index}.description`}
                          {...methods.register(`mvpFeatures.${index}.description`)}
                          placeholder="Describe this feature"
                          rows={2}
                        />
                        {errors.mvpFeatures?.[index]?.description && (
                          <p className="text-sm text-red-500">{errors.mvpFeatures[index]?.description?.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`mvpFeatures.${index}.priority`}>Priority</Label>
                          <Select
                            onValueChange={(value) =>
                              methods.setValue(`mvpFeatures.${index}.priority` as const, value as any)
                            }
                            defaultValue={field.priority}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`mvpFeatures.${index}.complexity`}>Complexity</Label>
                          <Select
                            onValueChange={(value) =>
                              methods.setValue(`mvpFeatures.${index}.complexity` as const, value as any)
                            }
                            defaultValue={field.complexity}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select complexity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="xs">XS (1-3 points)</SelectItem>
                              <SelectItem value="s">S (5 points)</SelectItem>
                              <SelectItem value="m">M (8 points)</SelectItem>
                              <SelectItem value="l">L (13 points)</SelectItem>
                              <SelectItem value="xl">XL (21+ points)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>User Stories</Label>
                        {methods.watch(`mvpFeatures.${index}.userStories`)?.map((_, storyIndex) => (
                          <div key={storyIndex} className="flex items-center space-x-2">
                            <Input
                              {...methods.register(`mvpFeatures.${index}.userStories.${storyIndex}`)}
                              placeholder="As a [user], I want to [action] so that [benefit]"
                            />
                            {storyIndex > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const currentStories = methods.getValues(`mvpFeatures.${index}.userStories`)
                                  methods.setValue(
                                    `mvpFeatures.${index}.userStories`,
                                    currentStories.filter((_, i) => i !== storyIndex),
                                  )
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentStories = methods.getValues(`mvpFeatures.${index}.userStories`) || []
                            methods.setValue(`mvpFeatures.${index}.userStories`, [...currentStories, ""])
                          }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add User Story
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <CostPreviewCard features={watchedMvpFeatures} budget={watchedBudget} />
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <Tabs defaultValue="future">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="future">Future Features</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                  </TabsList>

                  <TabsContent value="future" className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Future Features</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          appendFuture({
                            name: "",
                            description: "",
                            priority: "medium",
                            complexity: "m",
                            userStories: [""],
                          })
                        }
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Future Feature
                      </Button>
                    </div>

                    {futureFields.length === 0 && (
                      <div className="rounded-md bg-gray-50 p-4 text-center text-gray-500">
                        No future features added yet. Click the button above to add one.
                      </div>
                    )}

                    {futureFields.map((field, index) => (
                      <Card key={field.id} className="border border-gray-200">
                        <CardHeader className="bg-gray-50 p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-md font-medium">Future Feature {index + 1}</h4>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeFuture(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`futureFeatures.${index}.name`}>Feature Name</Label>
                            <Input
                              id={`futureFeatures.${index}.name`}
                              {...methods.register(`futureFeatures.${index}.name`)}
                              placeholder="e.g., Advanced Analytics"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`futureFeatures.${index}.description`}>Description</Label>
                            <Textarea
                              id={`futureFeatures.${index}.description`}
                              {...methods.register(`futureFeatures.${index}.description`)}
                              placeholder="Describe this feature"
                              rows={2}
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`futureFeatures.${index}.priority`}>Priority</Label>
                              <Select
                                onValueChange={(value) =>
                                  methods.setValue(`futureFeatures.${index}.priority` as const, value as any)
                                }
                                defaultValue={field.priority}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`futureFeatures.${index}.complexity`}>Complexity</Label>
                              <Select
                                onValueChange={(value) =>
                                  methods.setValue(`futureFeatures.${index}.complexity` as const, value as any)
                                }
                                defaultValue={field.complexity}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select complexity" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="xs">XS (1-3 points)</SelectItem>
                                  <SelectItem value="s">S (5 points)</SelectItem>
                                  <SelectItem value="m">M (8 points)</SelectItem>
                                  <SelectItem value="l">L (13 points)</SelectItem>
                                  <SelectItem value="xl">XL (21+ points)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="integrations" className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Integrations</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          appendIntegration({
                            name: "",
                            purpose: "",
                            apiDocumentation: "",
                          })
                        }
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Integration
                      </Button>
                    </div>

                    {integrationFields.length === 0 && (
                      <div className="rounded-md bg-gray-50 p-4 text-center text-gray-500">
                        No integrations added yet. Click the button above to add one.
                      </div>
                    )}

                    {integrationFields.map((field, index) => (
                      <Card key={field.id} className="border border-gray-200">
                        <CardHeader className="bg-gray-50 p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-md font-medium">Integration {index + 1}</h4>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeIntegration(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor={`integrations.${index}.name`}>Integration Name</Label>
                            <Input
                              id={`integrations.${index}.name`}
                              {...methods.register(`integrations.${index}.name`)}
                              placeholder="e.g., Stripe, Shopify, Google Analytics"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`integrations.${index}.purpose`}>Purpose</Label>
                            <Textarea
                              id={`integrations.${index}.purpose`}
                              {...methods.register(`integrations.${index}.purpose`)}
                              placeholder="What is this integration for?"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`integrations.${index}.apiDocumentation`}>
                              API Documentation URL (Optional)
                            </Label>
                            <Input
                              id={`integrations.${index}.apiDocumentation`}
                              {...methods.register(`integrations.${index}.apiDocumentation`)}
                              placeholder="https://..."
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">User Personas</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendPersona({
                          name: "",
                          role: "",
                          goals: "",
                          painPoints: "",
                        })
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Persona
                    </Button>
                  </div>

                  {personaFields.map((field, index) => (
                    <Card key={field.id} className="border border-gray-200">
                      <CardHeader className="bg-gray-50 p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-md font-medium">Persona {index + 1}</h4>
                          {index > 0 && (
                            <Button type="button" variant="ghost" size="sm" onClick={() => removePersona(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`personas.${index}.name`}>Name</Label>
                            <Input
                              id={`personas.${index}.name`}
                              {...methods.register(`personas.${index}.name`)}
                              placeholder="e.g., Marketing Manager Mary"
                            />
                            {errors.personas?.[index]?.name && (
                              <p className="text-sm text-red-500">{errors.personas[index]?.name?.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`personas.${index}.role`}>Role</Label>
                            <Input
                              id={`personas.${index}.role`}
                              {...methods.register(`personas.${index}.role`)}
                              placeholder="e.g., Marketing Manager"
                            />
                            {errors.personas?.[index]?.role && (
                              <p className="text-sm text-red-500">{errors.personas[index]?.role?.message}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`personas.${index}.goals`}>Goals</Label>
                          <Textarea
                            id={`personas.${index}.goals`}
                            {...methods.register(`personas.${index}.goals`)}
                            placeholder="What are this persona's main goals?"
                            rows={2}
                          />
                          {errors.personas?.[index]?.goals && (
                            <p className="text-sm text-red-500">{errors.personas[index]?.goals?.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`personas.${index}.painPoints`}>Pain Points</Label>
                          <Textarea
                            id={`personas.${index}.painPoints`}
                            {...methods.register(`personas.${index}.painPoints`)}
                            placeholder="What challenges does this persona face?"
                            rows={2}
                          />
                          {errors.personas?.[index]?.painPoints && (
                            <p className="text-sm text-red-500">{errors.personas[index]?.painPoints?.message}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Constraints</h3>

                  <div className="space-y-2">
                    <Label htmlFor="technicalConstraints">Technical Constraints</Label>
                    <Textarea
                      id="technicalConstraints"
                      {...methods.register("technicalConstraints")}
                      placeholder="Any technical limitations or requirements? (e.g., must work offline, must support IE11)"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessConstraints">Business Constraints</Label>
                    <Textarea
                      id="businessConstraints"
                      {...methods.register("businessConstraints")}
                      placeholder="Any business limitations or requirements? (e.g., must launch by Q4, regulatory compliance)"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Technology & Budget</h3>

                  <div className="space-y-2">
                    <Label htmlFor="preferredTechnologies">Preferred Technologies</Label>
                    <Textarea
                      id="preferredTechnologies"
                      {...methods.register("preferredTechnologies")}
                      placeholder="Any specific technologies you'd like to use? (e.g., React, Node.js, AWS)"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget (AUD)</Label>
                      <Input
                        id="budget"
                        type="number"
                        {...methods.register("budget", { valueAsNumber: true })}
                        placeholder="Enter your budget"
                      />
                      {errors.budget && <p className="text-sm text-red-500">{errors.budget.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeline">Timeline</Label>
                      <Input id="timeline" {...methods.register("timeline")} placeholder="e.g., 3 months, ASAP" />
                      {errors.timeline && <p className="text-sm text-red-500">{errors.timeline.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalComments">Additional Comments</Label>
                    <Textarea
                      id="additionalComments"
                      {...methods.register("additionalComments")}
                      placeholder="Anything else we should know?"
                      rows={3}
                    />
                  </div>
                </div>

                <CostPreviewCard features={watchedMvpFeatures} budget={watchedBudget} />

                {roadmapData && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Architecture Blueprint Summary</h3>

                    <Card>
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <h4 className="font-medium">Estimated Development Effort</h4>
                          <p>Total Story Points: {roadmapData.totalPoints}</p>
                          <p>Estimated Hours: {roadmapData.totalHours}</p>
                        </div>

                        <div>
                          <h4 className="font-medium">Blueprint Pricing</h4>
                          <p>Blueprint Fee: AU ${roadmapData.blueprintPricing.blueprintFee}</p>
                          <p>Additional Consultation: AU ${roadmapData.blueprintPricing.extraConsultationFee}/hr</p>
                        </div>

                        {roadmapData.realityCheck && (
                          <Alert>
                            <AlertDescription>{roadmapData.realityCheck}</AlertDescription>
                          </Alert>
                        )}

                        <Button
                          type="button"
                          onClick={async () => {
                            try {
                              const response = await fetch("/api/payment/checkout", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  projectId: roadmapData.projectId,
                                  customerEmail: "customer@example.com", // This would typically come from auth
                                }),
                              })

                              if (!response.ok) {
                                throw new Error("Failed to create checkout session")
                              }

                              const { url } = await response.json()
                              window.location.href = url
                            } catch (error) {
                              console.error("Checkout error:", error)
                            }
                          }}
                        >
                          Proceed to Payment
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 0}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>

        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}
      </form>
    </FormProvider>
  )
}
