import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, PartialType } from '@nestjs/swagger';
import { User } from 'src/data/entities/user.entity';
import { UpdateAddressRequestDto } from './address.dto';
import { AddressService } from './address.service';

@Controller('address')
export class AddressController {

    constructor(private addressService: AddressService){}

    @Patch('update-address/:token')
    @ApiOperation({ summary: 'Update user details during onboarding' })
    @ApiOkResponse({
       description: 'Returns the updated partial user entity',
       type: PartialType(User)
    })
    updateUserDetails(
       @Body() body: UpdateAddressRequestDto,
       @Param('token') token: string
    ) {
     return this.addressService.updateAddressDetails(body, token);
    }

}
