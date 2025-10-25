"use client"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
const orders = [
  {
    id: "ORD001",
    customer: "John Doe",
    product: "MacBook Pro",
    status: "shipped",
    date: "2024-01-15",
    amount: "$2,499.00",
  },
  {
    id: "ORD002", 
    customer: "Sarah Wilson",
    product: "iPhone 15",
    status: "processing",
    date: "2024-01-16",
    amount: "$999.00",
  },
  {
    id: "ORD003",
    customer: "Mike Johnson", 
    product: "AirPods Pro",
    status: "delivered",
    date: "2024-01-14",
    amount: "$249.00",
  },
  {
    id: "ORD004",
    customer: "Emma Brown",
    product: "iPad Air",
    status: "pending",
    date: "2024-01-17",
    amount: "$599.00",
  },
  {
    id: "ORD005",
    customer: "David Lee",
    product: "Apple Watch",
    status: "shipped",
    date: "2024-01-13",
    amount: "$399.00",
  },
]

export default function TableResponsive() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableCaption>Recent orders from your store.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{order.product}</TableCell>
                <TableCell>
                
                </TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell className="text-right">{order.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{order.id}</span>
                
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Customer</span>
                <span className="text-sm font-medium">{order.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Product</span>
                <span className="text-sm font-medium">{order.product}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="text-sm font-medium">{order.date}</span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-semibold">{order.amount}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    )};