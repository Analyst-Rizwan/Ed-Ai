from pydantic import BaseModel, EmailStr

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
    full_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    github_url: str | None = None
    linkedin_url: str | None = None
    website_url: str | None = None
    location: str | None = None


class UserOut(UserBase):
    id: int
    role: str = "user"
    class Config:
        orm_mode = True
