"use client"

import { Star, ThumbsUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const reviews = [
    {
        id: 1,
        author: "Emily R.",
        date: "2 weeks ago",
        rating: 5,
        text: "Dr. Wilson is amazing! She made me feel so comfortable during my whitening procedure. The results are incredible.",
        treatment: "Teeth Whitening",
    },
    {
        id: 2,
        author: "Michael T.",
        date: "1 month ago",
        rating: 5,
        text: "Best dental experience I've ever had. Very professional and the clinic is spotless. Highly recommend!",
        treatment: "Dental Cleaning",
    },
    {
        id: 3,
        author: "Sarah L.",
        date: "2 months ago",
        rating: 4,
        text: "Great service, but had to wait about 15 minutes past my appointment time. Otherwise excellent.",
        treatment: "Checkup",
    },
]

export function ReviewsSection() {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Patient Reviews</h2>

            <div className="flex flex-col md:flex-row gap-8 mb-8">
                {/* Overall Rating */}
                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-6 min-w-[200px]">
                    <span className="text-5xl font-bold text-gray-900 mb-2">4.9</span>
                    <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        ))}
                    </div>
                    <span className="text-sm text-gray-500">128 reviews</span>
                </div>

                {/* Rating Breakdown */}
                <div className="flex-1 space-y-2">
                    {[
                        { stars: 5, count: 85, percent: 85 },
                        { stars: 4, count: 10, percent: 10 },
                        { stars: 3, count: 3, percent: 3 },
                        { stars: 2, count: 1, percent: 1 },
                        { stars: 1, count: 1, percent: 1 },
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
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {review.treatment}
                            </span>
                            <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                                <ThumbsUp className="h-3 w-3" /> Helpful
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
