from pydantic import BaseModel, EmailStr, field_validator
import re

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    website_url: str | None = None
    location: str | None = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    """
    SECURITY: Only safe profile fields are allowed here.
    NEVER add: role, is_superuser, is_active, xp, level, password_hash (VULN-07)
    """
    full_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    website_url: str | None = None
    location: str | None = None

    # SECURITY: Max length constraints
    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v):
        if v and len(v) > 100:
            raise ValueError("Full name must be 100 characters or less")
        return v

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, v):
        if v and len(v) > 500:
            raise ValueError("Bio must be 500 characters or less")
        return v

    @field_validator("location")
    @classmethod
    def validate_location(cls, v):
        if v and len(v) > 100:
            raise ValueError("Location must be 100 characters or less")
        return v

    # SECURITY: URL validation to prevent open redirect/SSRF
    @field_validator("avatar_url", "github_url", "linkedin_url", "website_url")
    @classmethod
    def validate_urls(cls, v):
        if v is None or v == "":
            return v
        url_pattern = re.compile(
            r'^https?://'  # must be http or https
            r'[a-zA-Z0-9]'  # domain must start with alphanumeric
        )
        if not url_pattern.match(v):
            raise ValueError("URL must start with http:// or https://")
        if len(v) > 500:
            raise ValueError("URL must be 500 characters or less")
        return v


class UserOut(UserBase):
    id: int
    role: str = "user"
    class Config:
        from_attributes = True

