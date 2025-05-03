import { IsNotEmpty, Length } from "class-validator";

export class createShortenerDto {
  @IsNotEmpty({ message: "url is required" })
  @Length(4, 200, { message: "Url should be between 4 to 200 characters" })
  url: string;
}
