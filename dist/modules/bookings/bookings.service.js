"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BookingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const booking_schema_1 = require("./schemas/booking.schema");
const flights_service_1 = require("../flights/flights.service");
const tenants_service_1 = require("../tenants/tenants.service");
const stays_service_1 = require("../stays/stays.service");
const cars_service_1 = require("../cars/cars.service");
const cruises_service_1 = require("../cruises/cruises.service");
const packages_service_1 = require("../packages/packages.service");
const pagination_util_1 = require("../../common/utils/pagination.util");
const crypto_util_1 = require("../../common/utils/crypto.util");
const roles_constant_1 = require("../../common/constants/roles.constant");
let BookingsService = BookingsService_1 = class BookingsService {
    constructor(bookingModel, flightsService, tenantsService, staysService, carsService, cruisesService, packagesService) {
        this.bookingModel = bookingModel;
        this.flightsService = flightsService;
        this.tenantsService = tenantsService;
        this.staysService = staysService;
        this.carsService = carsService;
        this.cruisesService = cruisesService;
        this.packagesService = packagesService;
        this.logger = new common_1.Logger(BookingsService_1.name);
    }
    async create(userId, createBookingDto) {
        let pnr = '';
        let pnrExists = true;
        while (pnrExists) {
            pnr = (0, crypto_util_1.generatePNR)();
            pnrExists = !!(await this.bookingModel.findOne({ pnr }).exec());
        }
        let totalBaseFare = 0;
        let totalTaxes = 0;
        const bookingFlights = [];
        const bookingStays = [];
        const bookingCars = [];
        const bookingCruises = [];
        if (createBookingDto.flights) {
            for (const flightDto of createBookingDto.flights) {
                const flight = await this.flightsService.findById(flightDto.flightId);
                const flightClass = flight.classes?.find((c) => c.type === flightDto.class);
                if (!flightClass) {
                    throw new common_1.BadRequestException(`Class ${flightDto.class} not available on flight ${flight.flightNumber}`);
                }
                if (flightClass.seatsAvailable < flightDto.passengerIds.length) {
                    throw new common_1.BadRequestException(`Not enough seats available on flight ${flight.flightNumber}`);
                }
                totalBaseFare +=
                    flightClass.basePrice * flightDto.passengerIds.length;
                totalTaxes += (flightClass.basePrice * flightDto.passengerIds.length) * 0.12;
                bookingFlights.push({
                    flight: new mongoose_2.Types.ObjectId(flightDto.flightId),
                    class: flightDto.class,
                    passengers: flightDto.passengerIds.map((id) => new mongoose_2.Types.ObjectId(id)),
                });
                await this.flightsService.updateSeatAvailability(flightDto.flightId, flightDto.class, flightDto.passengerIds.length);
            }
        }
        if (createBookingDto.stays) {
            for (const stayDto of createBookingDto.stays) {
                const room = await this.staysService.getRoomById(stayDto.roomId);
                const checkIn = new Date(stayDto.checkIn);
                const checkOut = new Date(stayDto.checkOut);
                const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
                const stayPrice = room.pricePerNight * nights * stayDto.occupancy.rooms;
                totalBaseFare += stayPrice;
                totalTaxes += stayPrice * 0.10;
                bookingStays.push({
                    stay: new mongoose_2.Types.ObjectId(stayDto.hotelId),
                    room: new mongoose_2.Types.ObjectId(stayDto.roomId),
                    checkIn,
                    checkOut,
                    occupancy: stayDto.occupancy
                });
                await this.staysService.updateRoomAvailability(stayDto.roomId, stayDto.occupancy.rooms);
            }
        }
        if (createBookingDto.cars) {
            for (const carDto of createBookingDto.cars) {
                const car = await this.carsService.findById(carDto.carId);
                const carPrice = car.pricing.baseRate;
                totalBaseFare += carPrice;
                totalTaxes += carPrice * 0.05;
                bookingCars.push({
                    car: new mongoose_2.Types.ObjectId(carDto.carId),
                    pickUpDate: new Date(carDto.pickUpDate),
                    dropOffDate: new Date(carDto.dropOffDate),
                    pickUpLocation: carDto.pickUpLocation,
                    dropOffLocation: carDto.dropOffLocation
                });
            }
        }
        if (createBookingDto.cruises) {
            for (const cruiseDto of createBookingDto.cruises) {
                const cruise = await this.cruisesService.findById(cruiseDto.cruiseId);
                const cabin = cruise.cabinClasses.find(c => c.type === cruiseDto.cabinType);
                if (!cabin) {
                    throw new common_1.BadRequestException(`Cabin type ${cruiseDto.cabinType} not available on cruise ${cruise.name}`);
                }
                if (cabin.availability < cruiseDto.passengerIds.length) {
                    throw new common_1.BadRequestException(`Not enough availability for cabin ${cruiseDto.cabinType} on cruise ${cruise.name}`);
                }
                const cruisePrice = cabin.price * cruiseDto.passengerIds.length;
                totalBaseFare += cruisePrice;
                totalTaxes += cruisePrice * 0.08;
                bookingCruises.push({
                    cruise: new mongoose_2.Types.ObjectId(cruiseDto.cruiseId),
                    cabinType: cruiseDto.cabinType,
                    departureDate: new Date(cruiseDto.departureDate),
                    passengers: cruiseDto.passengerIds.map(id => new mongoose_2.Types.ObjectId(id))
                });
                await this.cruisesService.updateCabinAvailability(cruiseDto.cruiseId, cruiseDto.cabinType, cruiseDto.passengerIds.length);
            }
        }
        let discount = 0;
        if (createBookingDto.packageId) {
            const pkg = await this.packagesService.findById(createBookingDto.packageId);
            discount = totalBaseFare * (pkg.discountPercentage / 100);
        }
        let tenantMarkup = 0;
        if (createBookingDto.tenantId) {
            try {
                const tenant = await this.tenantsService.findById(createBookingDto.tenantId);
                tenantMarkup =
                    totalBaseFare * ((tenant.settings?.markupPercentage || 0) / 100);
            }
            catch {
            }
        }
        const totalPassengers = (createBookingDto.flights?.reduce((sum, f) => sum + f.passengerIds.length, 0) || 0) +
            (createBookingDto.stays?.reduce((sum, s) => sum + s.occupancy.adults + (s.occupancy.children || 0), 0) || 0);
        const totalAmount = totalBaseFare + totalTaxes + tenantMarkup - discount;
        const booking = new this.bookingModel({
            pnr: pnr.toUpperCase(),
            user: new mongoose_2.Types.ObjectId(userId),
            tenant: createBookingDto.tenantId
                ? new mongoose_2.Types.ObjectId(createBookingDto.tenantId)
                : null,
            package: createBookingDto.packageId
                ? new mongoose_2.Types.ObjectId(createBookingDto.packageId)
                : null,
            flights: bookingFlights,
            stays: bookingStays,
            cars: bookingCars,
            cruises: bookingCruises,
            contactDetails: createBookingDto.contactDetails,
            pricing: {
                baseFare: totalBaseFare,
                taxes: totalTaxes,
                fees: 0,
                tenantMarkup,
                discount,
                totalAmount,
                currency: createBookingDto.currency || 'USD',
            },
            payment: { status: roles_constant_1.PaymentStatus.PENDING },
            status: roles_constant_1.BookingStatus.PENDING,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            totalPassengers,
            isRoundTrip: createBookingDto.isRoundTrip || false,
            notes: createBookingDto.notes,
        });
        const saved = await booking.save();
        this.logger.log(`Booking created: ${saved.pnr} for user ${userId}`);
        return this.findById(saved._id.toString());
    }
    async findById(id) {
        const booking = await this.bookingModel
            .findById(id)
            .populate('user', 'firstName lastName email phone')
            .populate('tenant', 'name slug')
            .populate('flights.flight')
            .populate('flights.passengers')
            .populate('stays.stay')
            .populate('stays.room')
            .lean()
            .exec();
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        return booking;
    }
    async findByPNR(pnr) {
        const booking = await this.bookingModel
            .findOne({ pnr: pnr.toUpperCase() })
            .populate('user', 'firstName lastName email phone')
            .populate('tenant', 'name slug')
            .populate('flights.flight')
            .populate('flights.passengers')
            .populate('stays.stay')
            .populate('stays.room')
            .lean()
            .exec();
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        return booking;
    }
    async findUserBookings(userId, paginationDto, queryDto) {
        const query = { user: new mongoose_2.Types.ObjectId(userId) };
        if (queryDto?.status)
            query.status = queryDto.status;
        if (queryDto?.startDate || queryDto?.endDate) {
            query.bookedAt = {};
            if (queryDto.startDate)
                query.bookedAt.$gte = new Date(queryDto.startDate);
            if (queryDto.endDate)
                query.bookedAt.$lte = new Date(queryDto.endDate);
        }
        return (0, pagination_util_1.paginate)(this.bookingModel, query, paginationDto, ['flights.flight', 'flights.passengers', 'stays.stay', 'stays.room', 'cars.car', 'cruises.cruise', 'cruises.passengers', { path: 'tenant', select: 'name slug' }]);
    }
    async findTenantBookings(tenantId, paginationDto, queryDto) {
        const query = { tenant: new mongoose_2.Types.ObjectId(tenantId) };
        if (queryDto?.status)
            query.status = queryDto.status;
        if (queryDto?.startDate || queryDto?.endDate) {
            query.bookedAt = {};
            if (queryDto.startDate)
                query.bookedAt.$gte = new Date(queryDto.startDate);
            if (queryDto.endDate)
                query.bookedAt.$lte = new Date(queryDto.endDate);
        }
        return (0, pagination_util_1.paginate)(this.bookingModel, query, paginationDto, ['user', 'flights.flight', 'flights.passengers', 'stays.stay', 'stays.room', 'cars.car', 'cruises.cruise', 'cruises.passengers']);
    }
    async confirmBooking(bookingId) {
        const booking = await this.bookingModel
            .findByIdAndUpdate(bookingId, {
            status: roles_constant_1.BookingStatus.CONFIRMED,
            'payment.status': roles_constant_1.PaymentStatus.SUCCESS,
            'payment.paidAt': new Date(),
        }, { new: true })
            .exec();
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.tenant) {
            await this.tenantsService.incrementBookingCount(booking.tenant.toString(), booking.pricing.totalAmount);
        }
        this.logger.log(`Booking confirmed: ${booking.pnr}`);
        return booking;
    }
    async cancelBooking(id, userId, cancelDto) {
        const booking = await this.bookingModel.findById(id).exec();
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.user.toString() !== userId) {
            throw new common_1.BadRequestException('You can only cancel your own bookings');
        }
        if (booking.status === roles_constant_1.BookingStatus.CANCELLED ||
            booking.status === roles_constant_1.BookingStatus.REFUNDED) {
            throw new common_1.BadRequestException('Booking is already cancelled');
        }
        let refundAmount = 0;
        if (booking.payment.status === roles_constant_1.PaymentStatus.SUCCESS) {
            refundAmount = booking.pricing.totalAmount * 0.8;
        }
        for (const f of booking.flights) {
            await this.flightsService.restoreSeatAvailability(f.flight.toString(), f.class, f.passengers.length);
        }
        if (booking.stays) {
            for (const s of booking.stays) {
                await this.staysService.updateRoomAvailability(s.room.toString(), -s.occupancy.rooms);
            }
        }
        const updated = await this.bookingModel
            .findByIdAndUpdate(id, {
            status: roles_constant_1.BookingStatus.CANCELLED,
            cancellation: {
                reason: cancelDto.reason,
                cancelledAt: new Date(),
                refundAmount,
                refundStatus: refundAmount > 0 ? 'pending' : 'processed',
            },
        }, { new: true })
            .exec();
        this.logger.log(`Booking cancelled: ${booking.pnr}`);
        return updated;
    }
    async expireBookings() {
        const result = await this.bookingModel.updateMany({
            status: roles_constant_1.BookingStatus.PENDING,
            expiresAt: { $lte: new Date() },
        }, {
            status: roles_constant_1.BookingStatus.EXPIRED,
        }).exec();
        if (result.modifiedCount > 0) {
            this.logger.log(`Expired ${result.modifiedCount} bookings`);
        }
        return result.modifiedCount;
    }
    async getStats(tenantId) {
        const matchStage = {};
        if (tenantId)
            matchStage.tenant = new mongoose_2.Types.ObjectId(tenantId);
        const stats = await this.bookingModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$pricing.totalAmount' },
                },
            },
        ]).exec();
        const totalBookings = await this.bookingModel.countDocuments(matchStage).exec();
        const totalRevenue = stats
            .filter((s) => s._id === roles_constant_1.BookingStatus.CONFIRMED || s._id === roles_constant_1.BookingStatus.TICKETED)
            .reduce((sum, s) => sum + s.totalRevenue, 0);
        return {
            totalBookings,
            totalRevenue,
            byStatus: stats.reduce((acc, s) => {
                acc[s._id] = { count: s.count, revenue: s.totalRevenue };
                return acc;
            }, {}),
        };
    }
    async getAllBookings(paginationDto, queryDto) {
        const query = {};
        if (queryDto?.status)
            query.status = queryDto.status;
        if (queryDto?.tenantId)
            query.tenant = new mongoose_2.Types.ObjectId(queryDto.tenantId);
        if (queryDto?.startDate || queryDto?.endDate) {
            query.bookedAt = {};
            if (queryDto.startDate)
                query.bookedAt.$gte = new Date(queryDto.startDate);
            if (queryDto.endDate)
                query.bookedAt.$lte = new Date(queryDto.endDate);
        }
        return (0, pagination_util_1.paginate)(this.bookingModel, query, paginationDto, ['user', 'tenant', 'flights.flight', 'stays.stay', 'stays.room', 'cars.car', 'cruises.cruise', 'cruises.passengers']);
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = BookingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(booking_schema_1.Booking.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        flights_service_1.FlightsService,
        tenants_service_1.TenantsService,
        stays_service_1.StaysService,
        cars_service_1.CarsService,
        cruises_service_1.CruisesService,
        packages_service_1.PackagesService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map