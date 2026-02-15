"use client"

import { Star } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useLanguage } from "@/lib/LanguageContext"
import { cn } from "@/lib/utils"

interface ReviewsSectionProps {
    rating: number
    reviewCount: number
}

export function ReviewsSection({ rating, reviewCount }: ReviewsSectionProps) {
    const { t } = useLanguage()

    // Real reviews would be fetched from DB
    const reviews: any[] = []

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t('pages.profile.patient_reviews')}</h2>

            {reviewCount > 0 ? (
                <>
                    <div className="flex flex-col md:flex-row gap-8 mb-8">
                        {/* Overall Rating */}
                        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 min-w-[200px]">
                            <span className="text-5xl font-bold text-gray-900 mb-2">{rating.toFixed(1)}</span>
                            <div className="flex gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={cn("h-5 w-5", star <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200")} />
                                ))}
                            </div>
                            <span className="text-sm text-gray-500">{reviewCount} {t('pages.search.reviews')}</span>
                        </div>

                        {/* Rating Breakdown */}
                        <div className="flex-1 space-y-2">
                            {[
                                { stars: 5, count: 0, percent: 0 },
                                { stars: 4, count: 0, percent: 0 },
                                { stars: 3, count: 0, percent: 0 },
                                { stars: 2, count: 0, percent: 0 },
                                { stars: 1, count: 0, percent: 0 },
                            ].map((item) => (
                                <div key={item.stars} className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 w-12">
                                        <span className="text-sm font-medium text-gray-700">{item.stars}</span>
                                        <Star className="h-3 w-3 text-gray-400" />
                                    </div>
                                    <Progress value={item.percent} className="h-2" />
                                    <span className="text-sm text-gray-500 w-8">{item.percent}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reviews List */}
                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback className="bg-primary-100 text-primary-600">
                                                {review.author[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-gray-900">{review.author}</p>
                                            <p className="text-xs text-gray-500">{review.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed mb-2">
                                    {review.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Star className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500">No reviews yet for this dentist.</p>
                </div>
            )}
        </div>
    )
}
